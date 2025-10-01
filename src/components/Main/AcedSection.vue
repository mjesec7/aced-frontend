<template>
  <section class="aced-section" id="aced">
    <div class="section-header">
      <div class="header-content">
        <div class="label-badge">🚀 Начни обучение</div>
        <h1 class="headline">Начни своё обучение уже сегодня</h1>
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
      
      <div v-else-if="displayedCourses.length > 0" class="courses-container">
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
          <!-- Course Header -->
          <div class="course-header">
            <div class="course-badge" :class="getTopicType(course)">
              <span class="badge-icon">{{ getTopicTypeIcon(course) }}</span>
              <span class="badge-text">{{ getTopicTypeLabel(course) }}</span>
            </div>
            <div class="course-level">Ур. {{ course.level || 1 }}</div>
          </div>
          
          <!-- Course Content -->
          <div class="course-content">
            <h3 class="course-title">{{ getTopicName(course) }}</h3>
            <p class="course-description">{{ getTopicDescription(course) }}</p>
          </div>
          
          <!-- Course Stats -->
          <div class="course-stats">
            <div class="stat-item">
              <span class="stat-icon">📚</span>
              <span class="stat-text">{{ course.lessons?.length || 0 }} уроков</span>
            </div>
            <div class="stat-divider">•</div>
            <div class="stat-item">
              <span class="stat-icon">⏱</span>
              <span class="stat-text">{{ Math.round((course.totalTime || 0) / 60) || 1 }}ч</span>
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
            </button>
          </div>
          
          <!-- Gradient Overlay -->
          <div class="card-gradient" :class="getTopicType(course)"></div>
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
        // Try fetching from lessons first
        let coursesData = await this.fetchCoursesFromLessons();
        console.log('📊 Courses from lessons:', coursesData?.length, coursesData);
        
        // Fallback to topics if lessons didn't work
        if (!coursesData || coursesData.length === 0) {
          console.log('⚠️ No courses from lessons, trying topics...');
          coursesData = await this.fetchCoursesFromTopics();
          console.log('📊 Courses from topics:', coursesData?.length, coursesData);
        }
        
        // Set the courses data
        if (coursesData && coursesData.length > 0) {
          this.allCourses = coursesData;
          console.log('✅ Set allCourses:', this.allCourses.length);
          
          this.extractSubjects();
          this.filterCourses();
          
          console.log('✅ Final state:', {
            allCourses: this.allCourses.length,
            filteredCourses: this.filteredCourses.length,
            displayedCourses: this.displayedCourses.length,
            courses: this.displayedCourses
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
        console.log('📡 Lessons result:', lessonsResult);
        
        if (lessonsResult?.success && Array.isArray(lessonsResult.data) && lessonsResult.data.length > 0) {
          console.log('✅ Got', lessonsResult.data.length, 'lessons');
          const courses = this.buildCoursesFromLessons(lessonsResult.data);
          console.log('✅ Built', courses.length, 'courses from lessons');
          return courses;
        }
        
        console.warn('⚠️ No valid lessons data');
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
        console.log('📡 Topics result:', topicsResult);
        
        if (topicsResult?.success && Array.isArray(topicsResult.data) && topicsResult.data.length > 0) {
          console.log('✅ Got', topicsResult.data.length, 'topics');
          // Filter topics that have lessons
          const coursesWithLessons = topicsResult.data.filter(topic => {
            const hasLessons = topic.lessons && topic.lessons.length > 0;
            console.log('Topic:', topic.name, 'has lessons:', hasLessons, topic.lessons?.length);
            return hasLessons;
          });
          console.log('✅ Filtered to', coursesWithLessons.length, 'topics with lessons');
          return coursesWithLessons;
        }
        
        console.warn('⚠️ No valid topics data');
        return [];
      } catch (error) {
        console.error('❌ Error fetching courses from topics:', error);
        return [];
      }
    },

    buildCoursesFromLessons(lessons) {
      console.log('🔨 Building courses from', lessons.length, 'lessons');
      const coursesMap = new Map();
      
      lessons.forEach((lesson, index) => {
        if (!lesson?.topicId) {
          console.warn('⚠️ Lesson', index, 'has no topicId:', lesson);
          return;
        }
        
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) {
          console.warn('⚠️ Could not extract topicId from:', lesson.topicId);
          return;
        }
        
        const topicName = this.getTopicNameFromLesson(lesson);
        if (!topicName) {
          console.warn('⚠️ Could not get topic name from lesson:', lesson);
          return;
        }
        
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
          console.log('✅ Created new course:', topicName, 'ID:', topicId);
        } else {
          const course = coursesMap.get(topicId);
          course.lessons.push(lesson);
          course.lessonCount++;
          course.totalTime += this.calculateLessonTime(lesson);
          console.log('✅ Added lesson to existing course:', topicName);
        }
      });
      
      const coursesArray = Array.from(coursesMap.values());
      console.log('🔨 Built courses map:', coursesArray.length, 'unique courses');
      
      // Sort courses
      const sortedCourses = coursesArray.sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'free') return -1;
          if (b.type === 'free') return 1;
        }
        return a.subject.localeCompare(b.subject);
      });
      
      console.log('✅ Final sorted courses:', sortedCourses.length);
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
      console.log('📚 Extracted subjects:', this.availableSubjects);
    },

    filterCourses() {
      console.log('🔍 Filtering courses from', this.allCourses.length, 'total courses');
      
      // Simply show all courses without any filtering
      this.filteredCourses = [...this.allCourses];
      
      console.log('✅ Filtered courses:', this.filteredCourses.length);
      this.updateDisplayedCourses();
    },

    updateDisplayedCourses() {
      console.log('📋 Updating displayed courses from', this.filteredCourses.length, 'filtered courses');
      
      this.displayedCourses = this.filteredCourses.slice(0, this.maxDisplayedCourses);
      
      console.log('✅ Displayed courses set to:', this.displayedCourses.length, this.displayedCourses);
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
      if (description && description.length > 85) {
        return description.substring(0, 85) + '...';
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
  gap: 48px;
  padding: clamp(60px, 8vw, 100px) clamp(24px, 5vw, 80px);
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  min-height: 100vh;
  color: #0a0a0a;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.section-header {
  text-align: left;
  max-width: 100%;
  position: relative;
  z-index: 2;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 24px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7c3aed;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.headline {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #0a0a0a;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.context-text {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  color: #525252;
  font-weight: 400;
  margin: 0;
  line-height: 1.5;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  padding: 0;
}

.glass-card {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
  border: 3px solid rgba(139, 92, 246, 0.1);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.course-card {
  padding: 0;
  cursor: pointer;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #ffffff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
}

.course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.course-card:hover::before {
  opacity: 1;
}

.course-card.course-free::before {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.course-card.course-premium::before {
  background: linear-gradient(90deg, #a855f7, #9333ea);
}

.course-card.course-pro::before {
  background: linear-gradient(90deg, #ec4899, #db2777);
}

.card-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 140px;
  pointer-events: none;
  opacity: 0.4;
  transition: opacity 0.4s ease;
}

.card-gradient.free {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%);
}

.card-gradient.premium {
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, transparent 100%);
}

.card-gradient.pro {
  background: linear-gradient(180deg, rgba(236, 72, 153, 0.08) 0%, transparent 100%);
}

.course-card:hover .card-gradient {
  opacity: 0.6;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  position: relative;
  z-index: 3;
}

.course-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.course-badge.free {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.25);
}

.course-badge.premium {
  background: rgba(168, 85, 247, 0.12);
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.course-badge.pro {
  background: rgba(236, 72, 153, 0.12);
  color: #db2777;
  border: 1px solid rgba(236, 72, 153, 0.25);
}

.badge-icon {
  font-size: 0.875rem;
}

.course-level {
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #525252;
}

.course-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px 20px;
  position: relative;
  z-index: 3;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.3;
  margin: 0;
  letter-spacing: -0.02em;
}

.course-description {
  font-size: 0.875rem;
  color: #737373;
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
}

.course-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 3;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: #525252;
  font-weight: 500;
}

.stat-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.stat-text {
  font-weight: 600;
  color: #0a0a0a;
}

.stat-divider {
  color: #d4d4d4;
  font-weight: 300;
}

.course-actions {
  padding: 20px 24px;
  position: relative;
  z-index: 3;
}

.start-course-btn {
  position: relative;
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.start-course-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.125rem;
}

.btn-text {
  font-weight: 600;
}

.btn-free {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-free:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.btn-premium {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}

.btn-premium:hover:not(:disabled) {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
}

.btn-pro {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
}

.btn-pro:hover:not(:disabled) {
  background: linear-gradient(135deg, #db2777, #be185d);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

.empty-courses {
  text-align: center;
  padding: 60px 40px;
  max-width: 500px;
  margin: 0 auto;
  background: #ffffff;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.3;
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
  line-height: 1.6;
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
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
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
  max-width: 520px;
  padding: 48px;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
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
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.04);
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #737373;
  font-size: 1.75rem;
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
  margin-bottom: 36px;
}

.modal-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.modal-header p {
  color: #737373;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.course-preview {
  padding: 28px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(124, 58, 237, 0.04));
  border-radius: 16px;
  margin-bottom: 36px;
  border: 1.5px solid rgba(139, 92, 246, 0.15);
}

.course-info h3 {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0a0a0a;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}

.course-type {
  color: #7c3aed;
  font-weight: 600;
  font-size: 0.9375rem;
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
  font-size: 0.9375rem;
  color: #404040;
  font-weight: 500;
}

.benefit-icon {
  font-size: 1.375rem;
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
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.0625rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 36px rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
}

.btn-glow {
  display: none;
}

.cancel-btn {
  padding: 16px 36px;
  background: transparent;
  color: #737373;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 14px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.25);
  color: #525252;
}

/* Error Alert */
.error-alert {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 10000;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 420px;
  animation: slideInRight 0.3s ease;
  background: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
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
  font-size: 1.375rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
}

.retry-error-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .aced-section {
    padding: 48px 24px;
    gap: 36px;
  }

  .headline {
    font-size: 2rem;
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
    padding: 36px 20px;
  }

  .headline {
    font-size: 1.75rem;
  }

  .course-card {
    min-height: 300px;
  }

  .course-header {
    padding: 16px 20px;
  }

  .course-content {
    padding: 0 20px 16px;
  }

  .course-title {
    font-size: 1.125rem;
  }

  .course-stats {
    padding: 14px 20px;
  }

  .course-actions {
    padding: 16px 20px;
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
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>