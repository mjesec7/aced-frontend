<template>
  <section class="aced-section" id="aced">
    <div class="section-header">
      <div class="header-content">
        <div class="label-badge">🚀 Начни обучение</div>
        <h1 class="headline">Начни своё обучение<br />уже сегодня</h1>
        <p class="context-text">Выбери курс и начни изучать прямо сейчас</p>
      </div>
    </div>

    <!-- Course Cards Grid -->
    <div class="courses-grid">
      <div v-if="loadingCourses" class="loading-grid">
        <div class="course-placeholder glass-card" v-for="n in 6" :key="n">
          <div class="placeholder-content">
            <div class="loader-spinner"></div>
          </div>
        </div>
      </div>
      
      <div v-else-if="filteredCourses.length > 0" class="courses-container">
        <div 
          v-for="course in displayedCourses" 
          :key="course._id"
          class="course-card glass-card"
          :class="[
            `course-${getTopicType(course)}`,
            { 'featured': isFeaturedCourse(course) }
          ]"
          @click="handleCourseClick(course)"
        >
          <!-- Course Type Badge -->
          <div class="course-badge" :class="getTopicType(course)">
            <span class="badge-icon">{{ getTopicTypeIcon(course) }}</span>
            <span class="badge-text">{{ getTopicTypeLabel(course) }}</span>
          </div>
          
          <!-- Course Content -->
          <div class="course-content">
            <h3 class="course-title">{{ getTopicName(course) }}</h3>
            <p class="course-description">{{ getTopicDescription(course) }}</p>
            
            <!-- Course Stats -->
            <div class="course-stats">
              <div class="stat-item">
                <span class="stat-icon">📚</span>
                <span class="stat-value">{{ course.lessons?.length || 0 }}</span>
                <span class="stat-label">Уроков</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">⏱</span>
                <span class="stat-value">{{ Math.round((course.totalTime || 0) / 60) || 1 }}ч</span>
                <span class="stat-label">Времени</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📈</span>
                <span class="stat-value">Ур. {{ course.level || 1 }}</span>
                <span class="stat-label">Уровень</span>
              </div>
            </div>
          </div>
          
          <!-- Course Actions -->
          <div class="course-actions">
            <button 
              class="start-course-btn"
              :class="getStartButtonClass(course)"
              @click.stop="handleStartCourse(course)"
              :disabled="processingCourse === course._id"
            >
              <span class="btn-icon">{{ getStartButtonIcon(course) }}</span>
              <span class="btn-text">{{ getStartButtonText(course) }}</span>
              <span class="btn-glow"></span>
            </button>
          </div>
          
          <!-- Hover Effect Overlay -->
          <div class="card-shine"></div>
        </div>
      </div>
      
      <div v-else class="empty-courses glass-card">
        <div class="empty-icon">🔍</div>
        <h3>Курсы не найдены</h3>
        <p>Загружаем актуальные курсы...</p>
        <button v-if="!loadingCourses" @click="refreshCourses" class="retry-btn">
          <span>🔄</span>
          <span>Попробовать снова</span>
        </button>
      </div>
    </div>

    <!-- Registration Modal for Premium Access -->
    <div v-if="showRegistrationModal" class="modal-overlay" @click="closeRegistrationModal">
      <div class="registration-modal glass-card" @click.stop>
        <button class="close-btn" @click="closeRegistrationModal">
          <span>×</span>
        </button>
        
        <div class="modal-header">
          <div class="modal-icon">🎓</div>
          <h2>Премиум доступ</h2>
          <p>Для доступа к этому курсу необходимо зарегистрироваться</p>
        </div>
        
        <div class="course-preview" v-if="selectedCourse">
          <div class="course-info">
            <h3>{{ getTopicName(selectedCourse) }}</h3>
            <p class="course-type">{{ getTopicTypeLabel(selectedCourse) }} курс</p>
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
            <span class="btn-glow"></span>
          </button>
          <button class="cancel-btn" @click="closeRegistrationModal">
            Пока не готов
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="error-alert glass-card">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <button class="retry-error-btn" @click="refreshCourses">
        <span>🔄</span>
        <span>Повторить</span>
      </button>
    </div>
  </section>
</template>

<script>
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "vue-router";
import { getTopics, getAllLessons } from '@/api';

export default {
  name: "AcedSection",
  data() {
    return {
      allCourses: [],
      filteredCourses: [],
      displayedCourses: [],
      maxDisplayedCourses: 6,
      selectedSubject: '',
      selectedType: '',
      availableSubjects: [],
      loadingCourses: true,
      processingCourse: null,
      showRegistrationModal: false,
      selectedCourse: null,
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
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
        let coursesData = await this.fetchCoursesFromLessons();
        
        if (!coursesData || coursesData.length === 0) {
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
      this.filteredCourses = [...this.allCourses];
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
        
        if (topicType === 'free') {
          if (isAuthenticated) {
            await this.$router.push({ 
              name: 'TopicOverview',
              params: { id: course._id },
              query: { source: 'aced-section' }
            });
          } else {
            await this.$router.push({ 
              name: 'TopicOverview',
              params: { id: course._id },
              query: { source: 'aced-section', guest: 'true' }
            });
          }
        } else {
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
    
    getTopicName(course) {
      if (!course) return 'Без названия';
      return course.name || course.topicName || course.topic || course.title || 'Без названия';
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
      const icons = { free: '✨', premium: '💎', pro: '👑' };
      return icons[type] || '✨';
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
      if (type === 'free') return 'Начать';
      if (type === 'premium') return 'Получить доступ';
      return 'Pro доступ';
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
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      return 10;
    }
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

.aced-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 50px;
  padding: clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px);
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  min-height: 100vh;
  color: #0a0a0a;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.aced-section::before {
  content: '';
  position: absolute;
  bottom: -30%;
  right: -15%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(60px);
}

.section-header {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 30px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.headline {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 700;
  color: #0a0a0a;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.context-text {
  font-size: clamp(1.0625rem, 2vw, 1.1875rem);
  color: #404040;
  font-weight: 400;
  margin: 0;
}

.courses-grid {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.loading-grid, .courses-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

.glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(25px);
  border-radius: 20px;
  border: 1.5px solid rgba(139, 92, 246, 0.15);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08);
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.glass-card:hover::before {
  opacity: 1;
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
  pointer-events: none;
}

.glass-card:hover .card-shine {
  left: 100%;
}

.course-placeholder {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.course-card {
  padding: 32px;
  cursor: pointer;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-card:hover {
  transform: translateY(-8px) scale(1.01);
  box-shadow: 
    0 20px 60px rgba(139, 92, 246, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border-color: rgba(139, 92, 246, 0.4);
}

.course-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.course-card:hover::after {
  opacity: 1;
}

.course-card.course-free {
  border-left: 3px solid #8b5cf6;
}

.course-card.course-premium {
  border-left: 3px solid #a855f7;
}

.course-card.course-pro {
  border-left: 3px solid #ec4899;
}

.course-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(10px);
}

.course-badge.free {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1));
  color: #7c3aed;
  border: 1.5px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.2);
}

.course-badge.premium {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(192, 132, 252, 0.1));
  color: #9333ea;
  border: 1.5px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 2px 12px rgba(168, 85, 247, 0.2);
}

.course-badge.pro {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1));
  color: #db2777;
  border: 1.5px solid rgba(236, 72, 153, 0.3);
  box-shadow: 0 2px 12px rgba(236, 72, 153, 0.2);
}

.badge-icon {
  font-size: 0.875rem;
  filter: brightness(1.1);
}

.course-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.course-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.3;
  margin: 0;
  padding-right: 100px;
  letter-spacing: -0.01em;
}

.course-description {
  font-size: 0.9375rem;
  color: #737373;
  line-height: 1.6;
  margin: 8px 0;
  font-weight: 400;
}

.course-stats {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  margin-top: auto;
  border-top: 1.5px solid rgba(139, 92, 246, 0.08);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font-size: 0.8125rem;
}

.stat-icon {
  font-size: 1.125rem;
  margin-bottom: 2px;
}

.stat-value {
  font-weight: 700;
  color: #0a0a0a;
  font-size: 1rem;
}

.stat-label {
  color: #a3a3a3;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.course-actions {
  margin-top: 16px;
  position: relative;
  z-index: 2;
}

.start-course-btn {
  position: relative;
  width: 100%;
  padding: 16px 28px;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  letter-spacing: 0.01em;
}

.start-course-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, #a78bfa, #d8b4fe);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.start-course-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.start-course-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.start-course-btn:hover:not(:disabled) .btn-glow {
  opacity: 1;
}

.btn-icon {
  font-size: 1.125rem;
}

.btn-text {
  font-weight: 600;
}

.btn-free {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  color: white;
  box-shadow: 
    0 4px 20px rgba(139, 92, 246, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-free:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 35px rgba(139, 92, 246, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-premium {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%);
  color: white;
  box-shadow: 
    0 4px 20px rgba(168, 85, 247, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-premium:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 35px rgba(168, 85, 247, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-pro {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%);
  color: white;
  box-shadow: 
    0 4px 20px rgba(236, 72, 153, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-pro:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 35px rgba(236, 72, 153, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.empty-courses {
  text-align: center;
  padding: 60px 30px;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-courses h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0a0a;
  margin-bottom: 12px;
}

.empty-courses p {
  color: #737373;
  margin-bottom: 24px;
  font-size: 1rem;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
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
  width: 100%;
  max-width: 500px;
  padding: 40px;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  background: rgba(139, 92, 246, 0.08);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #737373;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.modal-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.modal-header p {
  color: #737373;
  font-size: 0.9375rem;
  margin: 0;
}

.course-preview {
  padding: 24px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 16px;
  margin-bottom: 32px;
  border: 1.5px solid rgba(139, 92, 246, 0.1);
}

.course-info h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 8px 0;
}

.course-type {
  color: #7c3aed;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0 0 20px 0;
}

.course-benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  color: #404040;
  font-weight: 500;
}

.benefit-icon {
  font-size: 1.25rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.register-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
}

.cancel-btn {
  padding: 14px 32px;
  background: transparent;
  color: #737373;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(139, 92, 246, 0.05);
  border-color: rgba(139, 92, 246, 0.3);
  color: #525252;
}

/* Error Alert */
.error-alert {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 10000;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  animation: slideInRight 0.3s ease;
  background: rgba(239, 68, 68, 0.95);
  border: 1.5px solid rgba(239, 68, 68, 0.3);
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
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  color: white;
  font-weight: 500;
  font-size: 0.9375rem;
}

.retry-error-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-error-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .loading-grid, .courses-container {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .aced-section {
    padding: 60px 24px;
    gap: 40px;
  }
  
  .headline {
    font-size: 2.5rem;
  }
  
  .courses-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .registration-modal {
    padding: 32px 24px;
  }
  
  .error-alert {
    bottom: 20px;
    right: 20px;
    left: 20px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .aced-section {
    padding: 40px 16px;
  }
  
  .headline {
    font-size: 2rem;
  }
  
  .course-card {
    padding: 20px;
    min-height: 260px;
  }
  
  .course-title {
    font-size: 1.125rem;
    padding-right: 70px;
  }
  
  .registration-modal {
    padding: 28px 20px;
  }
  
  .modal-header h2 {
    font-size: 1.5rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>