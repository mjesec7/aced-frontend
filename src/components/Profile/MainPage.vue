<template>
  <div class="professional-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-section">
          <h1 class="main-title">Добро пожаловать обратно! 👋</h1>
          <p class="date-text">{{ currentDate }}</p>
        </div>
        <div class="header-stats">
          <div class="stat-badge streak">
            <span class="icon">⚡</span>
            <div class="stat-info">
              <div class="stat-label">Streak</div>
              <div class="stat-value">{{ userStreak }} дней</div>
            </div>
          </div>
          <div class="stat-badge points">
            <span class="icon">🏆</span>
            <div class="stat-info">
              <div class="stat-label">Баллы</div>
              <div class="stat-value">{{ totalPoints }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Left Column -->
      <div class="main-column">
        <!-- Quick Stats -->
        <div class="quick-stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">📚</div>
            <div class="stat-data">
              <div class="stat-number">{{ studyList.length }}</div>
              <div class="stat-text">Курсов</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">✅</div>
            <div class="stat-data">
              <div class="stat-number">{{ completedCourses }}</div>
              <div class="stat-text">Завершено</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue">⏱</div>
            <div class="stat-data">
              <div class="stat-number">{{ totalHoursStudied }}ч</div>
              <div class="stat-text">Изучено</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">📈</div>
            <div class="stat-data">
              <div class="stat-number">{{ weekProgress }}%</div>
              <div class="stat-text">Прогресс</div>
            </div>
          </div>
        </div>

        <!-- Active Courses Section -->
        <div class="section-card">
          <div class="section-header">
            <div class="header-left">
              <div class="section-icon-badge">
                <span class="icon">📊</span>
              </div>
              <div>
                <h2 class="section-title">Активные курсы</h2>
                <p class="section-subtitle">{{ inProgressCourses }} в процессе</p>
              </div>
            </div>
            <router-link to="/profile/catalogue" class="view-all-link">
              Все курсы →
            </router-link>
          </div>

          <div v-if="loadingStudyList" class="loading-state">
            <div class="spinner"></div>
            <p>Загрузка курсов...</p>
          </div>

          <div v-else-if="filteredStudyList.length === 0" class="empty-state">
            <span class="empty-icon">📚</span>
            <p class="empty-text">У вас пока нет активных курсов</p>
            <router-link to="/profile/catalogue" class="add-course-btn">
              Добавить курс
            </router-link>
          </div>

          <div v-else class="courses-list">
            <div 
              v-for="course in displayedCourses" 
              :key="course._id"
              class="course-card"
              @click="navigateToCourse(course)"
            >
              <div class="course-header">
                <div class="course-info">
                  <div class="course-title-row">
                    <h3 class="course-title">{{ getCourseName(course) }}</h3>
                    <span :class="['type-badge', getTypeClass(course)]">
                      {{ getTypeLabel(course) }}
                    </span>
                  </div>
                  <div class="course-meta">
                    <span class="meta-item">
                      <span class="icon">📖</span>
                      Уровень {{ course.level || 1 }}
                    </span>
                    <span class="meta-item">
                      <span class="icon">⏰</span>
                      {{ formatTime(course.totalTime) }}
                    </span>
                    <span class="meta-item">
                      <span class="icon">📅</span>
                      {{ getLastAccessed(course) }}
                    </span>
                  </div>
                </div>
                <button class="play-btn" @click.stop="startCourse(course)">
                  <span class="icon">▶️</span>
                </button>
              </div>

              <div class="course-progress-section">
                <div class="progress-header">
                  <span class="next-lesson">
                    Следующий: {{ getNextLesson(course) }}
                  </span>
                  <span class="lessons-count">
                    {{ course.progress?.completedLessons || 0 }}/{{ course.lessons?.length || 0 }} уроков
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill"
                    :style="{ width: `${course.progress?.percent || 0}%` }"
                    :class="getProgressColorClass(course.progress?.percent || 0)"
                  ></div>
                </div>
              </div>

              <div class="course-footer">
                <span class="progress-percent">
                  {{ course.progress?.percent || 0 }}% завершено
                </span>
                <button class="continue-btn" @click.stop="startCourse(course)">
                  Продолжить →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section-card">
          <h2 class="section-title">
            <span class="icon">⚡</span>
            Быстрый доступ
          </h2>
          <div class="quick-actions-grid">
            <router-link
              v-for="action in quickActions"
              :key="action.id"
              :to="action.path"
              :class="['action-card', action.color]"
              @click="handleActionClick(action)"
            >
              <div v-if="action.premium" class="premium-badge">⭐</div>
              <span class="action-icon">{{ action.icon }}</span>
              <span class="action-title">{{ action.title }}</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="sidebar-column">
        <!-- Weekly Goals -->
        <div class="section-card">
          <div class="section-header small">
            <div class="section-icon-badge green">
              <span class="icon">🎯</span>
            </div>
            <div>
              <h3 class="section-title small">Цели недели</h3>
              <p class="section-subtitle">{{ completedGoals }}/{{ weeklyGoals.length }} завершено</p>
            </div>
          </div>
          <div class="goals-list">
            <div v-for="goal in weeklyGoals" :key="goal.id" class="goal-item">
              <div class="goal-header">
                <span class="goal-title">{{ goal.title }}</span>
                <span class="goal-progress">{{ goal.current }}/{{ goal.target }}</span>
              </div>
              <div class="progress-bar-container small">
                <div 
                  class="progress-bar-fill green"
                  :style="{ width: `${goal.progress}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section-card">
          <div class="section-header small">
            <div class="section-icon-badge blue">
              <span class="icon">📊</span>
            </div>
            <h3 class="section-title small">Последняя активность</h3>
          </div>
          <div class="activity-list">
            <div 
              v-for="activity in recentActivity" 
              :key="activity.id"
              class="activity-item"
            >
              <div :class="['activity-icon', activity.color]">
                {{ activity.icon }}
              </div>
              <div class="activity-content">
                <p class="activity-title">{{ activity.title }}</p>
                <p class="activity-time">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Study Insights -->
        <div class="insights-card">
          <div class="insights-header">
            <span class="icon">🧠</span>
            <h3 class="insights-title">Статистика обучения</h3>
          </div>
          <div class="insights-content">
            <div class="insight-item">
              <div class="insight-header">
                <span class="insight-label">Прогресс за неделю</span>
                <span class="insight-value">{{ weekProgress }}%</span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill white"
                  :style="{ width: `${weekProgress}%` }"
                ></div>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-header">
                <span class="insight-label">Прогресс за месяц</span>
                <span class="insight-value">{{ monthProgress }}%</span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill white"
                  :style="{ width: `${monthProgress}%` }"
                ></div>
              </div>
            </div>
            <div class="insight-divider"></div>
            <div class="insight-stat">
              <div class="insight-stat-label">Средняя оценка тестов</div>
              <div class="insight-stat-value">{{ averageTestScore }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <PaymentModal
      v-if="userId && showPaywall"
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="handlePaymentSuccess($event)"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import { 
  getUserStudyList,
  getUserProgress,
  getTopicById,
  getLessonsByTopic
} from '@/api';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'ProfessionalMainPage',
  components: { 
    PaymentModal 
  },
  
  mixins: [userStatusMixin],
  
  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'ru',
      
      studyList: [],
      userProgress: [],
      loadingStudyList: true,
      
      showPaywall: false,
      requestedTopicId: null,
      
      currentDate: '',
      
      quickActions: [
        { id: 1, title: 'Мои курсы', icon: '📚', path: '/profile/catalogue', color: 'purple', premium: false },
        { id: 2, title: 'Аналитика', icon: '📊', path: '/profile/analytics', color: 'blue', premium: true },
        { id: 3, title: 'Задания', icon: '📝', path: '/profile/homeworks', color: 'green', premium: false },
        { id: 4, title: 'Тесты', icon: '✅', path: '/profile/tests', color: 'orange', premium: true },
        { id: 5, title: 'Цели', icon: '🎯', path: '/profile/goal', color: 'pink', premium: true },
        { id: 6, title: 'Словарь', icon: '📖', path: '/profile/vocabulary', color: 'indigo', premium: true }
      ],
      
      weeklyGoals: [
        { id: 1, title: 'Завершить 5 уроков', current: 0, target: 5, progress: 0 },
        { id: 2, title: 'Изучать 2 часа в день', current: 0, target: 2, progress: 0 },
        { id: 3, title: 'Решить 3 теста', current: 0, target: 3, progress: 0 }
      ],
      
      recentActivity: []
    };
  },
  
  computed: {
    ...mapGetters('user', {
      vuexUserStatus: 'userStatus',
      vuexGetUser: 'getUser'
    }),
    
    currentUserStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },
    
    filteredStudyList() {
      return this.studyList.filter(course => 
        course && course.lessons && course.lessons.length > 0
      );
    },
    
    displayedCourses() {
      return this.filteredStudyList.slice(0, 3);
    },
    
    completedCourses() {
      return this.studyList.filter(c => c.progress?.percent === 100).length;
    },
    
    inProgressCourses() {
      return this.studyList.filter(c => 
        c.progress?.percent > 0 && c.progress?.percent < 100
      ).length;
    },
    
    totalHoursStudied() {
      const totalMinutes = this.studyList.reduce((sum, course) => 
        sum + (course.progress?.completedTime || 0), 0
      );
      return (totalMinutes / 60).toFixed(1);
    },
    
    weekProgress() {
      if (this.studyList.length === 0) return 0;
      const avgProgress = this.studyList.reduce((sum, c) => 
        sum + (c.progress?.percent || 0), 0
      ) / this.studyList.length;
      return Math.round(avgProgress);
    },
    
    monthProgress() {
      return Math.round(this.weekProgress * 0.85);
    },
    
    userStreak() {
      return 7; // This should come from your backend
    },
    
    totalPoints() {
      return this.userProgress.reduce((sum, p) => sum + (p.points || 0), 0);
    },
    
    averageTestScore() {
      const testScores = this.userProgress
        .filter(p => p.testScore)
        .map(p => p.testScore);
      if (testScores.length === 0) return 0;
      return Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length);
    },
    
    completedGoals() {
      return this.weeklyGoals.filter(g => g.progress === 100).length;
    }
  },
  
  async mounted() {
    await this.initialize();
  },
  
  methods: {
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || 
                    localStorage.getItem('firebaseUserId') || 
                    localStorage.getItem('userId');
      
      if (!this.userId) {
        this.$router.push('/');
        return;
      }
      
      this.updateCurrentDate();
      setInterval(this.updateCurrentDate, 60000);
      
      await this.loadData();
      this.updateGoalsFromProgress();
      this.generateRecentActivity();
    },
    
    updateCurrentDate() {
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      this.currentDate = new Date().toLocaleDateString('ru-RU', options);
    },
    
    async loadData() {
      try {
        this.loadingStudyList = true;
        
        const [studyListResult, progressResult] = await Promise.all([
          getUserStudyList(this.userId),
          getUserProgress(this.userId)
        ]);
        
        if (studyListResult?.success && Array.isArray(studyListResult.data)) {
          this.studyList = await this.enrichStudyList(studyListResult.data);
        }
        
        if (progressResult?.success && Array.isArray(progressResult.data)) {
          this.userProgress = progressResult.data;
        }
        
      } catch (error) {
        console.error('❌ Data loading error:', error);
      } finally {
        this.loadingStudyList = false;
      }
    },
    
    async enrichStudyList(rawList) {
      const enriched = [];
      
      for (const entry of rawList) {
        if (!entry?.topicId) continue;
        
        try {
          const topicResult = await getTopicById(entry.topicId);
          let topic = topicResult?.success ? topicResult.data : entry;
          
          if (!topic.lessons || topic.lessons.length === 0) {
            const lessonsResult = await getLessonsByTopic(entry.topicId);
            if (lessonsResult?.success && lessonsResult.data) {
              topic.lessons = lessonsResult.data;
            }
          }
          
          const progress = this.calculateProgress(topic.lessons);
          
          enriched.push({
            ...topic,
            progress,
            lastAccessed: entry.lastAccessed || new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error enriching topic ${entry.topicId}:`, error);
        }
      }
      
      return enriched;
    },
    
    calculateProgress(lessons) {
      if (!lessons || lessons.length === 0) {
        return { percent: 0, completedLessons: 0, totalLessons: 0, completedTime: 0, totalTime: 0 };
      }
      
      let completed = 0;
      let completedTime = 0;
      let totalTime = 0;
      
      lessons.forEach(lesson => {
        const lessonTime = lesson.estimatedTime || lesson.duration || 10;
        totalTime += lessonTime;
        
        const progress = this.userProgress.find(p => 
          (p.lessonId?._id || p.lessonId) === lesson._id
        );
        
        if (progress?.completed) {
          completed++;
          completedTime += lessonTime;
        }
      });
      
      return {
        percent: Math.round((completed / lessons.length) * 100),
        completedLessons: completed,
        totalLessons: lessons.length,
        completedTime,
        totalTime
      };
    },
    
    updateGoalsFromProgress() {
      const completedLessonsThisWeek = this.userProgress.filter(p => 
        p.completed && this.isThisWeek(p.completedAt)
      ).length;
      
      const hoursThisWeek = this.studyList.reduce((sum, course) => 
        sum + ((course.progress?.completedTime || 0) / 60), 0
      );
      
      const testsThisWeek = this.userProgress.filter(p => 
        p.testScore && this.isThisWeek(p.completedAt)
      ).length;
      
      this.weeklyGoals[0].current = Math.min(completedLessonsThisWeek, 5);
      this.weeklyGoals[0].progress = (completedLessonsThisWeek / 5) * 100;
      
      this.weeklyGoals[1].current = Math.min(hoursThisWeek, 2);
      this.weeklyGoals[1].progress = (hoursThisWeek / 2) * 100;
      
      this.weeklyGoals[2].current = Math.min(testsThisWeek, 3);
      this.weeklyGoals[2].progress = (testsThisWeek / 3) * 100;
    },
    
    generateRecentActivity() {
      const activities = [];
      
      const recentLessons = this.userProgress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 2);
      
      recentLessons.forEach(lesson => {
        activities.push({
          id: `lesson-${lesson._id}`,
          type: 'lesson',
          title: `Завершен урок "${lesson.lessonId?.lessonName || 'Урок'}"`,
          time: this.getTimeAgo(lesson.completedAt),
          icon: '✅',
          color: 'green'
        });
      });
      
      const recentTests = this.userProgress
        .filter(p => p.testScore)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 1);
      
      recentTests.forEach(test => {
        activities.push({
          id: `test-${test._id}`,
          type: 'test',
          title: `Тест: ${test.testScore}%`,
          time: this.getTimeAgo(test.completedAt),
          icon: '🏆',
          color: 'blue'
        });
      });
      
      this.recentActivity = activities.slice(0, 3);
    },
    
    isThisWeek(date) {
      if (!date) return false;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const checkDate = new Date(date);
      return checkDate >= weekAgo && checkDate <= now;
    },
    
    getTimeAgo(date) {
      if (!date) return 'недавно';
      const now = new Date();
      const past = new Date(date);
      const diff = now - past;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (hours < 1) return 'только что';
      if (hours < 24) return `${hours} ${this.pluralize(hours, 'час', 'часа', 'часов')} назад`;
      if (days < 7) return `${days} ${this.pluralize(days, 'день', 'дня', 'дней')} назад`;
      return 'более недели назад';
    },
    
    pluralize(count, one, few, many) {
      if (count % 10 === 1 && count % 100 !== 11) return one;
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return few;
      return many;
    },
    
    getCourseName(course) {
      return course.name || course.topicName || course.topic || course.title || 'Без названия';
    },
    
    getTypeClass(course) {
      const type = course.type || 'free';
      return type;
    },
    
    getTypeLabel(course) {
      const type = course.type || 'free';
      const labels = { free: 'Free', premium: 'Start', pro: 'Pro' };
      return labels[type] || 'Free';
    },
    
    formatTime(minutes) {
      if (!minutes) return '0ч';
      const hours = Math.round(minutes / 60);
      return `${hours}ч`;
    },
    
    getLastAccessed(course) {
      return this.getTimeAgo(course.lastAccessed);
    },
    
    getNextLesson(course) {
      if (!course.lessons || course.lessons.length === 0) return 'Нет уроков';
      
      const completed = course.progress?.completedLessons || 0;
      if (completed >= course.lessons.length) return 'Все уроки завершены';
      
      const nextLesson = course.lessons[completed];
      return nextLesson?.lessonName || nextLesson?.title || `Урок ${completed + 1}`;
    },
    
    getProgressColorClass(percent) {
      if (percent >= 80) return 'high';
      if (percent >= 50) return 'medium';
      if (percent >= 30) return 'low';
      return 'very-low';
    },
    
    navigateToCourse(course) {
      this.$router.push(`/topic/${course._id}/overview`);
    },
    
    async startCourse(course) {
      const hasAccess = this.hasTopicAccess(course);
      
      if (!hasAccess) {
        this.requestedTopicId = course._id;
        this.showPaywall = true;
        return;
      }
      
      this.$router.push(`/topic/${course._id}/overview`);
    },
    
    hasTopicAccess(topic) {
      const topicType = topic.type || 'free';
      const userStatus = this.currentUserStatus;
      
      if (topicType === 'free') return true;
      if (topicType === 'premium' && (userStatus === 'start' || userStatus === 'pro')) return true;
      if (topicType === 'pro' && userStatus === 'pro') return true;
      
      return false;
    },
    
    handleActionClick(action) {
      if (action.premium && !this.hasFeatureAccess(action.path)) {
        event.preventDefault();
        this.showPaywall = true;
      }
    },
    
    hasFeatureAccess(path) {
      const userStatus = this.currentUserStatus;
      if (userStatus === 'pro') return true;
      if (userStatus === 'start' && !path.includes('analytics')) return true;
      return false;
    },
    
    handlePaymentSuccess(newStatus) {
      this.showPaywall = false;
      this.$forceUpdate();
    }
  }
};
</script>

<style scoped>
.professional-dashboard {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .professional-dashboard {
    padding: 2rem 2.5rem;
  }
}

/* Header */
.dashboard-header {
  max-width: 1400px;
  margin: 0 auto 2rem;
}

.header-content {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.welcome-section .main-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.welcome-section .date-text {
  color: #6b7280;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid;
}

.stat-badge.streak {
  background: linear-gradient(to right, #fff7ed, #fef2f2);
  border-color: #fed7aa;
}

.stat-badge.points {
  background: linear-gradient(to right, #faf5ff, #ede9fe);
  border-color: #e9d5ff;
}

.stat-badge .icon {
  font-size: 1.25rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

/* Dashboard Grid */
.dashboard-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 2fr 1fr;
  }
}

/* Quick Stats */
.quick-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .quick-stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.purple { background: #f3e8ff; }
.stat-icon.green { background: #dcfce7; }
.stat-icon.blue { background: #dbeafe; }
.stat-icon.orange { background: #ffedd5; }

.stat-data {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-text {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header.small {
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon-badge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, #a855f7, #6366f1);
  font-size: 1.25rem;
}

.section-icon-badge.green {
  background: linear-gradient(to bottom right, #10b981, #059669);
}

.section-icon-badge.blue {
  background: linear-gradient(to bottom right, #3b82f6, #06b6d4);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title.small {
  font-size: 1rem;
}

.section-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.view-all-link {
  color: #a855f7;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #9333ea;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.add-course-btn {
  display: inline-block;
  background: #a855f7;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}

.add-course-btn:hover {
  background: #9333ea;
}

/* Course Cards */
.courses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
}

.course-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.course-info {
  flex: 1;
}

.course-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  transition: color 0.2s;
}

.course-card:hover .course-title {
  color: #a855f7;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid;
  font-weight: 600;
}

.type-badge.free {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #d1d5db;
}

.type-badge.premium {
  background: #faf5ff;
  color: #a855f7;
  border-color: #e9d5ff;
}

.type-badge.pro {
  background: linear-gradient(to right, #faf5ff, #fce7f3);
  color: #a855f7;
  border-color: #e9d5ff;
}

.course-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item .icon {
  font-size: 1rem;
}

.play-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: #f3e8ff;
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.play-btn:hover {
  background: #a855f7;
}

.play-btn .icon {
  font-size: 1rem;
  transition: all 0.2s;
}

.play-btn:hover .icon {
  filter: brightness(0) invert(1);
}

.course-progress-section {
  margin-bottom: 0.75rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.next-lesson {
  color: #111827;
  font-weight: 500;
}

.lessons-count {
  color: #6b7280;
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.progress-bar-container.small {
  height: 0.375rem;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-bar-fill.high {
  background: linear-gradient(to right, #10b981, #059669);
}

.progress-bar-fill.medium {
  background: linear-gradient(to right, #3b82f6, #2563eb);
}

.progress-bar-fill.low {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.progress-bar-fill.very-low {
  background: linear-gradient(to right, #ef4444, #dc2626);
}

.progress-bar-fill.green {
  background: linear-gradient(to right, #10b981, #059669);
}

.progress-bar-fill.white {
  background: white;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.progress-percent {
  font-size: 0.875rem;
  font-weight: 700;
  color: #a855f7;
}

.continue-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.continue-btn:hover {
  color: #a855f7;
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  border-radius: 0.75rem;
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: linear-gradient(to bottom right, #a855f7, #6366f1);
  border: none;
}

.action-card.purple {
  background: linear-gradient(to bottom right, #a855f7, #9333ea);
}

.action-card.blue {
  background: linear-gradient(to bottom right, #3b82f6, #2563eb);
}

.action-card.green {
  background: linear-gradient(to bottom right, #10b981, #059669);
}

.action-card.orange {
  background: linear-gradient(to bottom right, #f59e0b, #d97706);
}

.action-card.pink {
  background: linear-gradient(to bottom right, #ec4899, #db2777);
}

.action-card.indigo {
  background: linear-gradient(to bottom right, #6366f1, #4f46e5);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.premium-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.action-icon {
  font-size: 2rem;
}

.action-title {
  text-align: center;
  line-height: 1.2;
}

/* Sidebar Column */
.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Goals */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.goal-title {
  color: #111827;
  font-weight: 500;
}

.goal-progress {
  color: #6b7280;
  font-weight: 600;
}

/* Activity */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f9fafb;
}

.activity-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.activity-icon.green {
  background: #dcfce7;
}

.activity-icon.blue {
  background: #dbeafe;
}

.activity-icon.purple {
  background: #f3e8ff;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.activity-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Insights Card */
.insights-card {
  background: linear-gradient(to bottom right, #a855f7, #6366f1);
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
  padding: 1.5rem;
  color: white;
}

.insights-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.insights-header .icon {
  font-size: 1.5rem;
}

.insights-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.insights-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insight-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.insight-value {
  font-weight: 700;
  font-size: 1rem;
}

.insight-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0.5rem 0;
}

.insight-stat {
  padding-top: 0.5rem;
}

.insight-stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.insight-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

/* Responsive Adjustments */
@media (max-width: 640px) {
  .professional-dashboard {
    padding: 1rem;
  }

  .header-content {
    padding: 1rem;
  }

  .welcome-section .main-title {
    font-size: 1.5rem;
  }

  .header-stats {
    width: 100%;
  }

  .stat-badge {
    flex: 1;
    padding: 0.625rem 0.75rem;
  }

  .stat-badge .icon {
    font-size: 1.125rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .section-card {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.125rem;
  }

  .course-card {
    padding: 0.875rem;
  }

  .course-title {
    font-size: 1rem;
  }

  .meta-item {
    font-size: 0.8125rem;
  }

  .action-card {
    padding: 1rem 0.75rem;
  }

  .action-icon {
    font-size: 1.75rem;
  }

  .action-title {
    font-size: 0.8125rem;
  }
}

/* Tablet Adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .courses-list {
    gap: 1.25rem;
  }
}

/* Print Styles */
@media print {
  .professional-dashboard {
    background: white;
  }

  .play-btn,
  .continue-btn,
  .action-card,
  .add-course-btn {
    display: none;
  }

  .course-card {
    border: 1px solid #000;
    break-inside: avoid;
  }

  .insights-card {
    background: #f3f4f6;
    color: #000;
  }
}

/* Dark Mode Support (Optional) */
@media (prefers-color-scheme: dark) {
  .professional-dashboard {
    background: linear-gradient(to bottom right, #111827, #1f2937);
  }

  .dashboard-header,
  .section-card,
  .stat-card {
    background: #1f2937;
    border-color: #374151;
  }

  .welcome-section .main-title,
  .section-title,
  .course-title,
  .stat-number,
  .next-lesson,
  .goal-title,
  .activity-title {
    color: #f9fafb;
  }

  .date-text,
  .stat-text,
  .section-subtitle,
  .meta-item,
  .lessons-count,
  .goal-progress,
  .activity-time {
    color: #9ca3af;
  }

  .course-card {
    background: #1f2937;
    border-color: #374151;
  }

  .course-card:hover {
    border-color: #a855f7;
    background: #1f2937;
  }

  .progress-bar-container {
    background: #374151;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .spinner {
    animation: none;
    border: 3px solid #a855f7;
  }
}

/* Focus States */
.action-card:focus,
.course-card:focus,
.continue-btn:focus,
.play-btn:focus {
  outline: 3px solid #a855f7;
  outline-offset: 2px;
}

/* High Contrast Support */
@media (prefers-contrast: high) {
  .course-card,
  .section-card,
  .stat-card {
    border: 2px solid #000;
  }

  .action-card {
    border: 2px solid #fff;
  }

  .type-badge {
    border: 2px solid;
  }
}
</style>