<template>
  <section class="aced-section" id="aced">
    <div class="section-header">
      <div class="header-left">
        <div class="label-badge">🚀 Начни обучение</div>
        <h1 class="headline">Начни своё обучение уже сегодня</h1>
        <p class="context-text">Выбери курс и начни изучать прямо сейчас</p>
      </div>
      <button class="refresh-courses-btn" @click="shuffleCourses" :disabled="loadingCourses">
        <span class="refresh-icon" :class="{ 'spinning': isShuffling }">🔄</span>
        <span class="refresh-text">Обновить курсы</span>
      </button>
    </div>

    <!-- Course Cards Grid -->
    <div class="courses-grid">
      <div v-if="loadingCourses" class="loading-grid">
        <div class="course-placeholder" v-for="n in 8" :key="n">
          <div class="placeholder-content">
            <div class="loader-spinner"></div>
          </div>
        </div>
      </div>
      
      <div v-else-if="displayedCourses.length > 0" class="courses-container">
        <div 
          v-for="course in displayedCourses" 
          :key="course._id"
          class="course-card"
          :class="getTopicType(course)"
          @click="handleCourseClick(course)"
        >
          <!-- Decorative Corner -->
          <div class="card-corner"></div>
          
          <!-- Course Header -->
          <div class="course-header">
            <div class="badge-group">
              <div class="type-badge" :class="getTopicType(course)">
                <span class="badge-icon">{{ getTopicTypeIcon(course) }}</span>
                <span>{{ getTopicTypeLabel(course) }}</span>
              </div>
              <div class="subject-badge">
                {{ course.subject || 'Общий' }}
              </div>
            </div>
            <div class="level-badge">
              <span class="level-icon">📊</span>
              <span>{{ course.level || 1 }}</span>
            </div>
          </div>
          
          <!-- Course Content -->
          <div class="course-body">
            <h3 class="course-title">{{ getTopicName(course) }}</h3>
            <p class="course-description">{{ getTopicDescription(course) }}</p>
            
            <!-- Course Meta Info -->
            <div class="course-meta-info">
              <div class="meta-item">
                <span class="meta-icon">📖</span>
                <span class="meta-value">{{ course.lessons?.length || 0 }}</span>
                <span class="meta-label">уроков</span>
              </div>
              <div class="meta-divider"></div>
              <div class="meta-item">
                <span class="meta-icon">⏰</span>
                <span class="meta-value">{{ Math.round((course.totalTime || 0) / 60) || 1 }}</span>
                <span class="meta-label">часов</span>
              </div>
            </div>
          </div>
          
          <!-- Course Footer -->
          <div class="course-footer">
            <button 
              class="course-btn"
              :class="getStartButtonClass(course)"
              @click.stop="handleStartCourse(course)"
              :disabled="processingCourse === course._id"
            >
              <span class="btn-icon">{{ getStartButtonIcon(course) }}</span>
              <span class="btn-label">{{ getStartButtonText(course) }}</span>
              <div class="btn-shine"></div>
            </button>
          </div>
          
          <!-- Hover Glow Effect -->
          <div class="card-glow"></div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Курсы не найдены</h3>
        <p>Попробуйте обновить список курсов</p>
        <button @click="refreshCourses" class="retry-btn">
          <span>🔄</span>
          <span>Загрузить курсы</span>
        </button>
      </div>
    </div>

    <!-- Registration Modal for Premium Access -->
    <div v-if="showRegistrationModal" class="modal-overlay" @click="closeRegistrationModal">
      <div class="registration-modal" @click.stop>
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
          </button>
          <button class="cancel-btn" @click="closeRegistrationModal">
            Пока не готов
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="error-alert">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <button class="retry-error-btn" @click="refreshCourses">
        <span>🔄</span>
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
      maxDisplayedCourses: 8,
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
      isShuffling: false,
      lang: localStorage.getItem('lang') || 'ru'
    };
  },

  async mounted() {
    try {
      console.log('🚀 AcedSection mounting...');
      await this.initializeCourses();
    } catch (error) {
      console.error('❌ AcedSection mount error:', error);
      this.handleError(error);
    }
  },

  methods: {
    async initializeCourses() {
      console.log('📦 Initializing courses...');
      this.loadingCourses = true;
      this.errorMessage = null;
      
      try {
        let coursesData = await this.fetchCoursesFromLessons();
        console.log('📊 Courses from lessons:', coursesData?.length);
        
        if (!coursesData || coursesData.length === 0) {
          console.log('⚠️ No courses from lessons, trying topics...');
          coursesData = await this.fetchCoursesFromTopics();
          console.log('📊 Courses from topics:', coursesData?.length);
        }
        
        if (coursesData && coursesData.length > 0) {
          this.allCourses = coursesData;
          console.log('✅ Set allCourses:', this.allCourses.length);
          
          this.extractSubjects();
          this.filterCourses();
          
          console.log('✅ Final state:', {
            allCourses: this.allCourses.length,
            filteredCourses: this.filteredCourses.length,
            displayedCourses: this.displayedCourses.length
          });
        } else {
          console.warn('⚠️ No courses found from any source');
          this.allCourses = [];
          this.filteredCourses = [];
          this.displayedCourses = [];
        }
        
      } catch (error) {
        console.error('❌ Error initializing courses:', error);
        this.handleError(error);
      } finally {
        this.loadingCourses = false;
        console.log('✅ Loading complete. DisplayedCourses:', this.displayedCourses.length);
      }
    },

    async fetchCoursesFromLessons() {
      try {
        console.log('📡 Fetching lessons...');
        const lessonsResult = await getAllLessons();
        
        if (lessonsResult?.success && Array.isArray(lessonsResult.data) && lessonsResult.data.length > 0) {
          console.log('✅ Got', lessonsResult.data.length, 'lessons');
          const courses = this.buildCoursesFromLessons(lessonsResult.data);
          console.log('✅ Built', courses.length, 'courses from lessons');
          return courses;
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching courses from lessons:', error);
        return [];
      }
    },

    async fetchCoursesFromTopics() {
      try {
        console.log('📡 Fetching topics...');
        const topicsResult = await getTopics({ includeStats: true });
        
        if (topicsResult?.success && Array.isArray(topicsResult.data) && topicsResult.data.length > 0) {
          console.log('✅ Got', topicsResult.data.length, 'topics');
          const coursesWithLessons = topicsResult.data.filter(topic => {
            return topic.lessons && topic.lessons.length > 0;
          });
          console.log('✅ Filtered to', coursesWithLessons.length, 'topics with lessons');
          return coursesWithLessons;
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching courses from topics:', error);
        return [];
      }
    },

    buildCoursesFromLessons(lessons) {
      console.log('🔨 Building courses from', lessons.length, 'lessons');
      const coursesMap = new Map();
      
      lessons.forEach((lesson) => {
        if (!lesson?.topicId) return;
        
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;
        
        const topicName = this.getTopicNameFromLesson(lesson);
        if (!topicName) return;
        
        if (!coursesMap.has(topicId)) {
          const newCourse = {
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
          };
          coursesMap.set(topicId, newCourse);
        } else {
          const course = coursesMap.get(topicId);
          course.lessons.push(lesson);
          course.lessonCount++;
          course.totalTime += this.calculateLessonTime(lesson);
        }
      });
      
      const coursesArray = Array.from(coursesMap.values());
      console.log('🔨 Built courses map:', coursesArray.length, 'unique courses');
      
      const sortedCourses = coursesArray.sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'free') return -1;
          if (b.type === 'free') return 1;
        }
        return a.subject.localeCompare(b.subject);
      });
      
      return sortedCourses;
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
      console.log('🔍 Filtering courses from', this.allCourses.length, 'total courses');
      
      // Show ONLY free courses from all subjects
      this.filteredCourses = this.allCourses.filter(course => {
        const type = this.getTopicType(course);
        return type === 'free';
      });
      
      console.log('✅ Filtered to', this.filteredCourses.length, 'free courses');
      this.updateDisplayedCourses();
    },

    updateDisplayedCourses() {
      console.log('📋 Updating displayed courses');
      
      // Shuffle and take 8 random FREE courses (2 rows x 4 columns)
      const shuffled = [...this.filteredCourses].sort(() => Math.random() - 0.5);
      this.displayedCourses = shuffled.slice(0, this.maxDisplayedCourses);
      
      console.log('✅ Displayed', this.displayedCourses.length, 'random free courses');
    },

    shuffleCourses() {
      if (this.isShuffling || this.loadingCourses) return;
      
      this.isShuffling = true;
      console.log('🔀 Shuffling courses...');
      
      // Animate shuffle
      setTimeout(() => {
        this.updateDisplayedCourses();
        this.isShuffling = false;
      }, 500);
    },

    async refreshCourses() {
      if (this.retryCount >= this.maxRetries) {
        this.errorMessage = 'Превышено максимальное количество попыток';
        return;
      }
      
      this.retryCount++;
      console.log('🔄 Refreshing courses, attempt:', this.retryCount);
      await this.initializeCourses();
      
      if (!this.errorMessage) {
        this.retryCount = 0;
      }
    },

    handleCourseClick(course) {
      console.log('👆 Course clicked:', course);
      this.handleStartCourse(course);
    },

    async handleStartCourse(course) {
      if (!course?._id || this.processingCourse === course._id) {
        console.warn('⚠️ Invalid course or already processing');
        return;
      }
      
      console.log('🚀 Starting course:', course);
      this.processingCourse = course._id;
      
      try {
        const topicType = this.getTopicType(course);
        const isAuthenticated = this.checkUserAuthentication();
        
        console.log('Course type:', topicType, 'Authenticated:', isAuthenticated);
        
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
      console.error('❌ Error handled:', errorMessage, error);
    },

    getTopicName(course) {
      if (!course) return 'Без названия';
      return course.name || course.topicName || course.topic || course.title || 'Без названия';
    },

    getTopicDescription(course) {
      if (!course) return 'Изучайте новые навыки';
      
      const description = course.description || course.topicDescription;
      if (description && description.length > 100) {
        return description.substring(0, 100) + '...';
      }
      return description || `Изучите ${this.getTopicName(course)} с практическими заданиями`;
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
      return `btn-${type}`;
    },

    getStartButtonIcon(course) {
      if (this.processingCourse === course._id) return '⏳';
      const type = this.getTopicType(course);
      if (type === 'free') return '▶';
      return '🔒';
    },

    getStartButtonText(course) {
      if (this.processingCourse === course._id) return 'Загрузка...';
      const type = this.getTopicType(course);
      if (type === 'free') return 'Начать курс';
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
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.aced-section {
  position: relative;
  padding: clamp(60px, 8vw, 100px) clamp(24px, 5vw, 80px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}

.aced-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

/* Header Styles */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  margin-bottom: 56px;
  position: relative;
  z-index: 10;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 8px 18px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.08));
  border: 1.5px solid rgba(139, 92, 246, 0.25);
  border-radius: 30px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #7c3aed;
  letter-spacing: 0.03em;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.headline {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin: 0;
}

.context-text {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: #64748b;
  font-weight: 500;
  line-height: 1.6;
  margin: 0;
}

.refresh-courses-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  white-space: nowrap;
  height: fit-content;
}

.refresh-courses-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.45);
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
}

.refresh-courses-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.25rem;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-icon.spinning {
  animation: spin 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Grid Styles */
.courses-grid {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-grid,
.courses-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
  width: 100%;
}

.course-placeholder {
  height: 380px;
  background: white;
  border-radius: 20px;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Card Styles */
.course-card {
  position: relative;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
}

.course-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.15);
}

.course-card.free {
  border-color: rgba(139, 92, 246, 0.2);
}

.course-card.free:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.25);
}

.course-card.premium {
  border-color: rgba(168, 85, 247, 0.2);
}

.course-card.premium:hover {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 16px 48px rgba(168, 85, 247, 0.25);
}

.course-card.pro {
  border-color: rgba(236, 72, 153, 0.2);
}

.course-card.pro:hover {
  border-color: rgba(236, 72, 153, 0.4);
  box-shadow: 0 16px 48px rgba(236, 72, 153, 0.25);
}

.card-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), transparent);
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  transition: opacity 0.3s ease;
}

.course-card:hover .card-corner {
  opacity: 0.6;
}

.card-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(124, 58, 237, 0.4));
  border-radius: 20px;
  opacity: 0;
  filter: blur(20px);
  transition: opacity 0.4s ease;
  z-index: -1;
}

.course-card:hover .card-glow {
  opacity: 0.5;
}

/* Card Header */
.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 20px;
  gap: 12px;
}

.badge-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
}

.type-badge.free {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1));
  color: #7c3aed;
  border: 1.5px solid rgba(139, 92, 246, 0.3);
}

.type-badge.premium {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(147, 51, 234, 0.1));
  color: #9333ea;
  border: 1.5px solid rgba(168, 85, 247, 0.3);
}

.type-badge.pro {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1));
  color: #db2777;
  border: 1.5px solid rgba(236, 72, 153, 0.3);
}

.badge-icon {
  font-size: 0.875rem;
}

.subject-badge {
  display: inline-flex;
  padding: 4px 12px;
  background: rgba(100, 116, 139, 0.08);
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #475569;
  width: fit-content;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
  border: 1.5px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #2563eb;
}

.level-icon {
  font-size: 0.875rem;
}

/* Card Body */
.course-body {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0;
}

.course-description {
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
}

.course-meta-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0 0;
  margin-top: 8px;
  border-top: 2px solid #f1f5f9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 1.125rem;
}

.meta-value {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.meta-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
}

.meta-divider {
  width: 4px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 50%;
}

/* Card Footer */
.course-footer {
  padding: 20px 24px 24px;
}

.course-btn {
  position: relative;
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  letter-spacing: 0.01em;
}

.course-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.125rem;
  transition: transform 0.3s ease;
}

.course-btn:hover:not(:disabled) .btn-icon {
  transform: translateX(4px);
}

.btn-label {
  font-weight: 700;
}

.btn-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  transform: translateX(-100%) translateY(-100%) rotate(45deg);
  transition: transform 0.6s ease;
}

.course-btn:hover:not(:disabled) .btn-shine {
  transform: translateX(100%) translateY(100%) rotate(45deg);
}

.btn-free {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn-free:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
}

.btn-premium {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
}

.btn-premium:hover:not(:disabled) {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.5);
}

.btn-pro {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.3);
}

.btn-pro:hover:not(:disabled) {
  background: linear-gradient(135deg, #db2777, #be185d);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.5);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  opacity: 0.4;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 28px;
  font-size: 1rem;
  line-height: 1.6;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.registration-modal {
  width: 100%;
  max-width: 540px;
  padding: 48px;
  background: white;
  border-radius: 24px;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.25);
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
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  background: rgba(100, 116, 139, 0.08);
  border: 2px solid rgba(100, 116, 139, 0.15);
  border-radius: 14px;
  color: #64748b;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  margin-bottom: 36px;
}

.modal-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px 0;
  letter-spacing: -0.03em;
}

.modal-header p {
  color: #64748b;
  font-size: 1.0625rem;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
}

.course-preview {
  padding: 28px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
  border-radius: 18px;
  margin-bottom: 36px;
  border: 2px solid rgba(139, 92, 246, 0.2);
}

.course-info h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.course-type {
  color: #7c3aed;
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 24px 0;
}

.course-benefits {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  color: #334155;
  font-weight: 600;
}

.benefit-icon {
  font-size: 1.5rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.register-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px 36px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 800;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
}

.cancel-btn {
  padding: 16px 36px;
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

/* Error Alert */
.error-alert {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 100000;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 450px;
  background: #ef4444;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(239, 68, 68, 0.4);
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
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.retry-error-btn {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-error-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .loading-grid,
  .courses-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }

  .refresh-courses-btn {
    align-self: flex-start;
  }
}

@media (max-width: 768px) {
  .aced-section {
    padding: 48px 24px;
  }

  .headline {
    font-size: 2rem;
  }

  .loading-grid,
  .courses-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .registration-modal {
    padding: 36px 24px;
  }

  .modal-header h2 {
    font-size: 1.75rem;
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
    padding: 36px 20px;
  }

  .headline {
    font-size: 1.75rem;
  }

  .loading-grid,
  .courses-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .course-header {
    padding: 20px 20px 16px;
  }

  .course-body {
    padding: 0 20px 20px;
  }

  .course-title {
    font-size: 1.25rem;
  }

  .course-footer {
    padding: 16px 20px 20px;
  }

  .registration-modal {
    padding: 28px 20px;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }

  .register-btn {
    padding: 16px 28px;
    font-size: 1rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>