<template>
  <div class="diary-page">
    <!-- Enhanced Header -->
    <header class="diary-header">
      <div class="header-content">
        <div class="header-icon">📅</div>
        <h1 class="page-title">Дневник обучения</h1>
        <p class="page-subtitle">{{ today }}</p>
        <div class="header-decoration"></div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p class="loading-text">Загрузка данных дневника...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Произошла ошибка</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchData" class="retry-button">
        <span class="button-icon">🔄</span>
        Попробовать снова
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Today's Summary -->
      <section class="today-summary">
        <div class="summary-header">
          <h2 class="section-title">Сегодня</h2>
          <div class="today-date">{{ formatDate(new Date()) }}</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card primary">
            <div class="card-icon">⏱️</div>
            <div class="card-content">
              <div class="card-value">{{ studyMinutes }}</div>
              <div class="card-label">минут изучено</div>
              <div class="card-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: Math.min((studyMinutes / 60) * 100, 100) + '%' }"></div>
                </div>
                <span class="progress-text">Цель: 60 мин</span>
              </div>
            </div>
          </div>

          <div class="summary-card success">
            <div class="card-icon">🎯</div>
            <div class="card-content">
              <div class="card-value">{{ completedToday.length }}</div>
              <div class="card-label">тем завершено</div>
              <div class="card-trend" v-if="completedToday.length > 0">
                <span class="trend-icon">📈</span>
                <span class="trend-text">Отличная работа!</span>
              </div>
            </div>
          </div>

          <div class="summary-card warning">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <div class="card-value">{{ progressPercent }}%</div>
              <div class="card-label">прогресс дня</div>
              <div class="progress-circle">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path
                    class="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="circle"
                    :stroke-dasharray="`${progressPercent}, 100`"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" class="percentage">{{ progressPercent }}%</text>
                </svg>
              </div>
            </div>
          </div>

          <div class="summary-card info">
            <div class="card-icon">⭐</div>
            <div class="card-content">
              <div class="card-value">{{ analytics.totalStars || 0 }}</div>
              <div class="card-label">звёзд заработано</div>
              <div class="stars-display">
                <span v-for="n in Math.min(analytics.totalStars || 0, 5)" :key="n" class="star active">⭐</span>
                <span v-for="n in Math.max(0, 5 - (analytics.totalStars || 0))" :key="`empty-${n}`" class="star">☆</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Study Cards Grid -->
      <section class="study-cards">
        <div class="cards-grid">
          <!-- Lessons for Today -->
          <div class="study-card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon">📚</span>
                Уроки на сегодня
              </h3>
              <div class="card-badge">{{ lessonsToday.length }}</div>
            </div>
            <div class="card-body">
              <div v-if="lessonsToday.length > 0" class="lessons-list">
                <div 
                  v-for="lesson in lessonsToday" 
                  :key="lesson._id"
                  class="lesson-item"
                >
                  <div class="lesson-info">
                    <div class="lesson-subject">{{ lesson.subject }}</div>
                    <div class="lesson-topic">{{ lesson.topic }}</div>
                  </div>
                  <div class="lesson-status">
                    <span class="status-dot pending"></span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <div class="empty-icon">✅</div>
                <p class="empty-text">Все уроки на сегодня завершены!</p>
              </div>
            </div>
          </div>

          <!-- Lessons for Tomorrow -->
          <div class="study-card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon">🔮</span>
                Планы на завтра
              </h3>
              <div class="card-badge secondary">{{ lessonsTomorrow.length }}</div>
            </div>
            <div class="card-body">
              <div v-if="lessonsTomorrow.length > 0" class="lessons-list">
                <div 
                  v-for="lesson in lessonsTomorrow" 
                  :key="lesson._id"
                  class="lesson-item"
                >
                  <div class="lesson-info">
                    <div class="lesson-subject">{{ lesson.subject }}</div>
                    <div class="lesson-topic">{{ lesson.topic }}</div>
                  </div>
                  <div class="lesson-status">
                    <span class="status-dot scheduled"></span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <div class="empty-icon">📝</div>
                <p class="empty-text">Новые уроки скоро появятся!</p>
              </div>
            </div>
          </div>

          <!-- Grades This Week -->
          <div class="study-card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon">🏆</span>
                Оценки за неделю
              </h3>
              <div class="card-badge success">{{ gradesThisWeek.length }}</div>
            </div>
            <div class="card-body">
              <div v-if="gradesThisWeek.length > 0" class="grades-list">
                <div 
                  v-for="grade in gradesThisWeek" 
                  :key="grade.lessonId"
                  class="grade-item"
                >
                  <div class="grade-info">
                    <div class="grade-subject">{{ grade.subject }}</div>
                    <div class="grade-topic">{{ grade.topic }}</div>
                  </div>
                  <div class="grade-score" :class="getGradeClass(grade.score)">
                    {{ grade.score }}%
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <div class="empty-icon">📈</div>
                <p class="empty-text">Пока нет оценок на этой неделе</p>
              </div>
            </div>
          </div>

          <!-- Analytics Overview -->
          <div class="study-card analytics">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon">📊</span>
                Аналитика
              </h3>
            </div>
            <div class="card-body">
              <div class="analytics-grid">
                <div class="analytics-item">
                  <div class="analytics-icon">🎯</div>
                  <div class="analytics-content">
                    <div class="analytics-value">{{ analytics.totalPoints || 0 }}</div>
                    <div class="analytics-label">Очков</div>
                  </div>
                </div>
                <div class="analytics-item">
                  <div class="analytics-icon">💡</div>
                  <div class="analytics-content">
                    <div class="analytics-value">{{ analytics.hintsUsed || 0 }}</div>
                    <div class="analytics-label">Подсказок</div>
                  </div>
                </div>
                <div class="analytics-item">
                  <div class="analytics-icon">🔥</div>
                  <div class="analytics-content">
                    <div class="analytics-value">{{ getStreakDays() }}</div>
                    <div class="analytics-label">Дней подряд</div>
                  </div>
                </div>
                <div class="analytics-item">
                  <div class="analytics-icon">⚡</div>
                  <div class="analytics-content">
                    <div class="analytics-value">{{ getAverageTime() }}</div>
                    <div class="analytics-label">Среднее время</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="action-section">
        <div class="action-buttons">
          <button 
            class="action-button primary" 
            @click="saveDiary" 
            :disabled="diarySaved || saving"
            :class="{ saved: diarySaved, saving: saving }"
          >
            <span class="button-icon">
              {{ saving ? '⏳' : diarySaved ? '✅' : '💾' }}
            </span>
            <span class="button-text">
              {{ saving ? 'Сохранение...' : diarySaved ? 'Сохранено!' : 'Завершить день' }}
            </span>
          </button>
          
          <button class="action-button secondary" @click="exportDiary">
            <span class="button-icon">📤</span>
            <span class="button-text">Экспорт</span>
          </button>
        </div>
        
        <div v-if="saveMessage" class="save-message" :class="saveMessageType">
          <div class="message-icon">
            {{ saveMessageType === 'success' ? '✅' : saveMessageType === 'error' ? '❌' : 'ℹ️' }}
          </div>
          <span class="message-text">{{ saveMessage }}</span>
        </div>
      </section>

      <!-- Diary History -->
      <section class="diary-history" v-if="recentDiaryLogs.length > 0">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">📖</span>
            История дневника
          </h2>
          <div class="history-stats">
            {{ recentDiaryLogs.length }} записей
          </div>
        </div>

        <div class="history-timeline">
          <div 
            v-for="(log, index) in recentDiaryLogs" 
            :key="log.date"
            class="timeline-item"
            :class="{ latest: index === 0 }"
          >
            <div class="timeline-marker">
              <div class="marker-dot"></div>
              <div v-if="index < recentDiaryLogs.length - 1" class="marker-line"></div>
            </div>
            
            <div class="timeline-content">
              <div class="timeline-header">
                <h4 class="timeline-date">{{ formatDate(log.date) }}</h4>
                <div class="timeline-badges">
                  <span v-if="log.studyMinutes > 60" class="badge success">Активный день</span>
                  <span v-if="log.completedTopics?.length > 3" class="badge info">Продуктивно</span>
                </div>
              </div>
              
              <div class="timeline-stats">
                <div class="stat-item">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-text">{{ log.studyMinutes }} мин</span>
                </div>
                <div class="stat-item" v-if="log.completedTopics?.length">
                  <span class="stat-icon">📚</span>
                  <span class="stat-text">{{ log.completedTopics.length }} тем</span>
                </div>
                <div class="stat-item" v-if="log.gradesToday?.length">
                  <span class="stat-icon">🏆</span>
                  <span class="stat-text">{{ log.gradesToday.length }} оценок</span>
                </div>
              </div>

              <!-- Expandable Details -->
              <div v-if="log.completedTopics?.length || log.gradesToday?.length" class="timeline-details">
                <div v-if="log.completedTopics?.length" class="details-section">
                  <h5 class="details-title">Завершённые темы:</h5>
                  <div class="topics-tags">
                    <span 
                      v-for="topic in log.completedTopics.slice(0, 3)" 
                      :key="topic" 
                      class="topic-tag"
                    >
                      {{ topic }}
                    </span>
                    <span v-if="log.completedTopics.length > 3" class="topic-tag more">
                      +{{ log.completedTopics.length - 3 }}
                    </span>
                  </div>
                </div>

                <div v-if="log.gradesToday?.length" class="details-section">
                  <h5 class="details-title">Оценки:</h5>
                  <div class="grades-list">
                    <div 
                      v-for="grade in log.gradesToday.slice(0, 3)" 
                      :key="grade.topic"
                      class="grade-item"
                    >
                      <span class="grade-subject">{{ grade.subject }}</span>
                      <span class="grade-score" :class="getGradeClass(grade.score)">
                        {{ grade.score }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Toast Notifications -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <div class="toast-icon">
        {{ toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : 'ℹ️' }}
      </div>
      <span class="toast-text">{{ toastMessage }}</span>
      <button @click="toastMessage = ''" class="toast-close">×</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { mapState } from 'vuex';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'DiaryPage',
  data() {
    return {
      today: '',
      lessons: [],
      userProgress: {},
      lessonsToday: [],
      lessonsTomorrow: [],
      gradesThisWeek: [],
      completedToday: [],
      studyMinutes: 0,
      diarySaved: false,
      diaryLogs: [],
      loading: true,
      saving: false,
      error: '',
      timer: null,
      analytics: {
        totalStars: 0,
        totalPoints: 0,
        hintsUsed: 0
      },
      saveMessage: '',
      saveMessageType: 'success',
      toastMessage: '',
      toastType: 'success'
    };
  },
  computed: {
    ...mapState(['firebaseUserId']),
    progressPercent() {
      const total = this.completedToday.length + this.lessonsToday.length;
      return total > 0 ? Math.round((this.completedToday.length / total) * 100) : 0;
    },
    recentDiaryLogs() {
      return [...this.diaryLogs]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);
    }
  },
  mounted() {
    this.today = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    this.startTimer();
    this.fetchData();
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        this.studyMinutes++;
      }, 60000); // Every minute
    },

    async fetchData() {
      const userId = this.firebaseUserId;
      if (!userId) {
        this.error = 'Пользователь не авторизован. Пожалуйста, войдите в систему.';
        this.loading = false;
        return;
      }

      try {
        this.loading = true;
        this.error = '';
        
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('Не удалось получить токен авторизации');
        }
        
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all required data
        const requests = [
          axios.get(`${BASE_URL}/lessons`, { headers }).catch(err => ({ data: [] })),
          axios.get(`${BASE_URL}/users/${userId}`, { headers }).catch(err => ({ data: { progress: {}, diary: [] } })),
          axios.get(`${BASE_URL}/users/${userId}/analytics`, { headers }).catch(err => ({ data: {} }))
        ];

        const [lessonsRes, userRes, analyticsRes] = await Promise.all(requests);

        this.lessons = lessonsRes.data || [];
        this.userProgress = userRes.data?.progress || {};
        this.diaryLogs = userRes.data?.diary || [];
        this.analytics = analyticsRes.data?.data || analyticsRes.data || {};

        this.calculateToday();
        this.showToast('Данные загружены успешно', 'success');
        
      } catch (error) {
this.error = this.getErrorMessage(error);
        this.showToast('Ошибка загрузки данных', 'error');
      } finally {
        this.loading = false;
      }
    },

    getErrorMessage(error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        switch (status) {
          case 401:
            return 'Сессия истекла. Пожалуйста, войдите в систему заново.';
          case 403:
            return 'Нет доступа к данным. Проверьте права доступа.';
          case 404:
            return 'Данные не найдены. Возможно, они были удалены.';
          case 500:
            return 'Ошибка сервера. Попробуйте позже.';
          default:
            return message || `Ошибка ${status}. Попробуйте еще раз.`;
        }
      } else if (error.request) {
        return 'Проблемы с подключением к серверу. Проверьте интернет-соединение.';
      } else {
        return error.message || 'Произошла неизвестная ошибка.';
      }
    },

    calculateToday() {
      const sections = ['explanation', 'examples', 'exercises', 'quiz'];
      const todayLessons = [];
      const tomorrowLessons = [];
      const completed = [];
      const grades = [];

      this.lessons.forEach(lesson => {
        const progress = this.userProgress[lesson._id] || {};
        const done = sections.filter(sec => progress[sec]).length;
        const score = Math.round((done / sections.length) * 100);

        if (done === sections.length) {
          completed.push(`${lesson.topic} (${lesson.subject})`);
          grades.push({ 
            lessonId: lesson._id, 
            subject: lesson.subject, 
            topic: lesson.topic, 
            score: 100 
          });
        } else if (done > 0) {
          grades.push({ 
            lessonId: lesson._id, 
            subject: lesson.subject, 
            topic: lesson.topic, 
            score 
          });
        }

        if (!progress.explanation && !progress.examples && !progress.exercises && !progress.quiz) {
          tomorrowLessons.push(lesson);
        } else if (todayLessons.length < 3 && done < sections.length) {
          todayLessons.push(lesson);
        }
      });

      this.completedToday = completed;
      this.lessonsToday = todayLessons;
      this.lessonsTomorrow = tomorrowLessons.slice(0, 3);
      this.gradesThisWeek = grades;
    },

    async saveDiary() {
      const userId = this.firebaseUserId;
      if (!userId) {
        this.showToast('Пользователь не авторизован', 'error');
        return;
      }

      try {
        this.saving = true;
        this.saveMessage = '';
        
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('Не удалось получить токен авторизации');
        }

        const diaryData = {
          date: new Date().toISOString(),
          studyMinutes: this.studyMinutes,
          completedTopics: this.completedToday,
          averageGrade: this.gradesThisWeek.length > 0
            ? Math.round(this.gradesThisWeek.reduce((sum, g) => sum + g.score, 0) / this.gradesThisWeek.length)
            : 0,
          gradesToday: this.gradesThisWeek,
          stars: this.analytics.totalStars || 0,
          mistakes: 0 // You can add mistake tracking if needed
        };


        const response = await axios.post(
          `${BASE_URL}/users/${userId}/diary`,
          diaryData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );


        this.diarySaved = true;
        this.saveMessage = 'Дневник сохранён успешно!';
        this.saveMessageType = 'success';
        this.showToast('День завершён и сохранён!', 'success');

        // Update local diary logs
        if (response.data?.data?.diary) {
          this.diaryLogs = response.data.data.diary;
        }

      } catch (error) {
const errorMessage = this.getErrorMessage(error);
        this.saveMessage = errorMessage;
        this.saveMessageType = 'error';
        this.showToast('Ошибка сохранения дневника', 'error');
        
      } finally {
        this.saving = false;
        
        // Clear save message after 5 seconds
        setTimeout(() => {
          this.saveMessage = '';
        }, 5000);
      }
    },

    async exportDiary() {
      try {
        const dataStr = JSON.stringify(this.diaryLogs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `diary_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Дневник экспортирован', 'success');
      } catch (error) {
this.showToast('Ошибка экспорта', 'error');
      }
    },

    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },

    getGradeClass(score) {
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 70) return 'satisfactory';
      return 'poor';
    },

    getStreakDays() {
      if (!this.diaryLogs || this.diaryLogs.length === 0) return 0;
      
      const sortedDiary = this.diaryLogs
        .filter(entry => entry.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);
      currentDate.setHours(0, 0, 0, 0);
      
      for (const entry of sortedDiary) {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0 || diffDays === 1) {
          streak++;
          currentDate = new Date(entryDate);
        } else {
          break;
        }
      }
      
      return streak;
    },

    getAverageTime() {
      if (!this.diaryLogs || this.diaryLogs.length === 0) return '0м';
      
      const totalMinutes = this.diaryLogs.reduce((sum, entry) => sum + (entry.studyMinutes || 0), 0);
      const avgMinutes = Math.round(totalMinutes / this.diaryLogs.length);
      
      if (avgMinutes >= 60) {
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;
        return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
      }
      
      return `${avgMinutes}м`;
    },

    showToast(message, type = 'success') {
      this.toastMessage = message;
      this.toastType = type;
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        this.toastMessage = '';
      }, 3000);
    }
  }
};
</script>

<style scoped>
/* Enhanced Variables */
:root {
  --primary-color: #8b5cf6;
  --primary-dark: #7c3aed;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  --danger-color: #ef4444;
  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  --border-radius: 12px;
  --border-radius-lg: 20px;
  --border-radius-xl: 24px;
  
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base Styles */
.diary-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gray-50) 0%, #e2e8f0 100%);
  color: var(--gray-900);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
}

.diary-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* Enhanced Header */
.diary-header {
  text-align: center;
  margin-bottom: 48px;
  position: relative;
  animation: slideInDown 0.8s ease-out;
}

.header-content {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  padding: 48px;
  box-shadow: var(--shadow-xl);
  border: 2px solid rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.header-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--warning-color));
  background-size: 300% 100%;
  animation: gradientFlow 6s ease-in-out infinite;
}

.header-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3));
}

.page-title {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 18px;
  color: var(--gray-600);
  margin: 0;
  font-weight: 500;
}

.header-decoration {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 2px;
  animation: pulse 2s ease-in-out infinite;
}

/* Loading States */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 40px;
  height: 40px;
  top: 10px;
  left: 10px;
  animation-delay: -0.4s;
  border-top-color: var(--success-color);
}

.spinner-ring:nth-child(3) {
  width: 20px;
  height: 20px;
  top: 20px;
  left: 20px;
  animation-delay: -0.8s;
  border-top-color: var(--warning-color);
}

.loading-text {
  color: var(--gray-600);
  font-size: 16px;
  font-weight: 500;
}

.error-container {
  border: 2px solid var(--danger-color);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.error-title {
  color: var(--danger-color);
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.error-message {
  color: var(--gray-600);
  margin-bottom: 32px;
  font-size: 16px;
  max-width: 500px;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--danger-color);
  color: var(--white);
  border: none;
  padding: 14px 28px;
  border-radius: var(--border-radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-md);
}

.retry-button:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Today's Summary */
.today-summary {
  margin-bottom: 48px;
  animation: slideInUp 0.8s ease-out 0.2s both;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
}

.today-date {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--white);
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-md);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.summary-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: 32px 24px;
  box-shadow: var(--shadow-lg);
  border: 2px solid transparent;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: var(--transition);
}

.summary-card.primary::before {
  background: linear-gradient(90deg, var(--primary-color), #a78bfa);
}

.summary-card.success::before {
  background: linear-gradient(90deg, var(--success-color), #34d399);
}

.summary-card.warning::before {
  background: linear-gradient(90deg, var(--warning-color), #fbbf24);
}

.summary-card.info::before {
  background: linear-gradient(90deg, var(--info-color), #60a5fa);
}

.summary-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-2xl);
  border-color: var(--primary-color);
}

.summary-card:hover::before {
  height: 6px;
}

.card-icon {
  font-size: 36px;
  margin-bottom: 16px;
  display: block;
}

.card-content {
  text-align: center;
}

.card-value {
  font-size: 36px;
  font-weight: 800;
  color: var(--gray-900);
  line-height: 1;
  margin-bottom: 8px;
}

.card-label {
  font-size: 14px;
  color: var(--gray-600);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.card-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-dark));
  border-radius: 4px;
  transition: width 1s ease-in-out;
}

.progress-text {
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
}

.card-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 16px;
}

.progress-circle {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 50px;
  height: 50px;
}

.circular-chart {
  display: block;
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--gray-200);
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke: var(--warning-color);
  stroke-width: 3;
  stroke-linecap: round;
  animation: progressCircle 1s ease-in-out forwards;
}

.percentage {
  fill: var(--warning-color);
  font-family: sans-serif;
  font-size: 0.4em;
  font-weight: bold;
  text-anchor: middle;
}

.stars-display {
  margin-top: 12px;
}

.star {
  font-size: 16px;
  margin: 0 2px;
  transition: var(--transition);
}

.star.active {
  animation: starTwinkle 2s ease-in-out infinite;
}

/* Study Cards */
.study-cards {
  margin-bottom: 48px;
  animation: slideInUp 0.8s ease-out 0.4s both;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
}

.study-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transition: var(--transition);
  border: 2px solid transparent;
}

.study-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.study-card.analytics {
  background: linear-gradient(135deg, var(--white) 0%, #fafafa 100%);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-badge {
  background: var(--primary-color);
  color: var(--white);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.card-badge.secondary {
  background: var(--gray-400);
}

.card-badge.success {
  background: var(--success-color);
}

.card-body {
  padding: 0 24px 24px;
}

/* Lessons and Grades Lists */
.lessons-list, .grades-list {
  max-height: 300px;
  overflow-y: auto;
}

.lesson-item, .grade-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--gray-50);
  border-radius: var(--border-radius);
  transition: var(--transition);
  border-left: 4px solid transparent;
}

.lesson-item:hover, .grade-item:hover {
  background: var(--gray-100);
  transform: translateX(4px);
}

.lesson-info, .grade-info {
  flex: 1;
}

.lesson-subject, .grade-subject {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.lesson-topic, .grade-topic {
  font-size: 16px;
  color: var(--gray-900);
  font-weight: 500;
}

.lesson-status {
  margin-left: 16px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.pending {
  background: var(--warning-color);
  animation: pulse 2s ease-in-out infinite;
}

.status-dot.scheduled {
  background: var(--info-color);
}

.grade-score {
  font-size: 18px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: var(--border-radius);
  color: var(--white);
  text-align: center;
  min-width: 60px;
}

.grade-score.excellent {
  background: var(--success-color);
}

.grade-score.good {
  background: var(--info-color);
}

.grade-score.satisfactory {
  background: var(--warning-color);
}

.grade-score.poor {
  background: var(--danger-color);
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-500);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
}

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.analytics-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%);
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
  transition: var(--transition);
}

.analytics-item:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, var(--white) 100%);
  border-color: var(--primary-color);
  transform: scale(1.02);
}

.analytics-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 50%;
}

.analytics-content {
  flex: 1;
}

.analytics-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
  margin-bottom: 4px;
}

.analytics-label {
  font-size: 12px;
  color: var(--gray-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Action Section */
.action-section {
  margin-bottom: 48px;
  text-align: center;
  animation: slideInUp 0.8s ease-out 0.6s both;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-md);
  min-width: 180px;
  justify-content: center;
}

.action-button.primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--white);
}

.action-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-dark), #6d28d9);
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.action-button.primary.saving {
  background: var(--gray-400);
  cursor: not-allowed;
}

.action-button.primary.saved {
  background: var(--success-color);
  animation: successPulse 0.6s ease-out;
}

.action-button.secondary {
  background: var(--white);
  color: var(--gray-700);
  border: 2px solid var(--gray-200);
}

.action-button.secondary:hover {
  background: var(--gray-50);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.button-icon {
  font-size: 18px;
}

.button-text {
  font-weight: 600;
}

.save-message {
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 400px;
  margin: 0 auto;
}

.save-message.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.save-message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.message-icon {
  font-size: 16px;
}

.message-text {
  font-size: 14px;
}

/* Diary History */
.diary-history {
  animation: slideInUp 0.8s ease-out 0.8s both;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.history-stats {
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
}

.history-timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 32px;
  position: relative;
}

.timeline-item.latest .timeline-content {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, var(--white) 100%);
  border-color: var(--primary-color);
}

.timeline-marker {
  position: relative;
  margin-right: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  border-radius: 50%;
  border: 4px solid var(--white);
  box-shadow: 0 0 0 2px var(--primary-color);
  z-index: 2;
}

.timeline-item.latest .marker-dot {
  background: var(--success-color);
  box-shadow: 0 0 0 2px var(--success-color);
  animation: pulse 2s ease-in-out infinite;
}

.marker-line {
  width: 2px;
  height: 100%;
  background: var(--gray-200);
  margin-top: 8px;
  flex: 1;
  min-height: 40px;
}

.timeline-content {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--gray-100);
  flex: 1;
  transition: var(--transition);
}

.timeline-content:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.timeline-date {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.timeline-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.badge.info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.timeline-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--gray-600);
}

.stat-icon {
  font-size: 16px;
}

.stat-text {
  font-weight: 500;
}

.timeline-details {
  border-top: 1px solid var(--gray-100);
  padding-top: 16px;
  margin-top: 16px;
}

.details-section {
  margin-bottom: 16px;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-700);
  margin: 0 0 8px 0;
}

.topics-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.topic-tag {
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.topic-tag.more {
  background: var(--primary-color);
  color: var(--white);
}

/* Toast Notifications */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: var(--white);
  color: var(--gray-900);
  padding: 16px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: toastSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--primary-color);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  min-width: 300px;
}

.toast.error {
  border-color: var(--danger-color);
  background: #fef2f2;
  color: #991b1b;
}

.toast.success {
  border-color: var(--success-color);
  background: #ecfdf5;
  color: #065f46;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0;
  margin-left: 8px;
}

.toast-close:hover {
  opacity: 1;
}

/* Animations */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradientFlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes progressCircle {
  0% { stroke-dasharray: 0 100; }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes toastSlideIn {
  from {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .diary-page {
    padding: 24px 20px;
  }
  
  .summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .diary-page {
    padding: 20px 16px;
  }
  
  .header-content {
    padding: 32px 24px;
  }
  
  .page-title {
    font-size: 32px;
  }
  
  .header-icon {
    font-size: 48px;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .summary-card {
    padding: 24px 20px;
  }
  
  .card-value {
    font-size: 28px;
  }
  
  .progress-circle {
    position: static;
    margin: 16px auto 0;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-button {
    width: 100%;
    max-width: 300px;
  }
  
  .timeline-stats {
    gap: 16px;
  }
  
  .timeline-item {
    margin-bottom: 24px;
  }
  
  .summary-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .diary-page {
    padding: 16px 12px;
  }
  
  .header-content {
    padding: 24px 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .section-title {
    font-size: 22px;
  }
  
  .card-header {
    padding: 20px 20px 0;
  }
  
  .card-body {
    padding: 0 20px 20px;
  }
  
  .lesson-item, .grade-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .lesson-status {
    margin-left: 0;
    align-self: flex-end;
  }
  
  .timeline-content {
    padding: 20px 16px;
  }
  
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .timeline-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .topics-tags {
    gap: 6px;
  }
  
  .toast {
    left: 12px;
    right: 12px;
    top: 16px;
    max-width: none;
    min-width: auto;
  }
}

/* Accessibility */
.action-button:focus,
.retry-button:focus,
.toast-close:focus {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
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

/* Print styles */
@media print {
  .diary-page {
    background: white !important;
  }
  
  .action-section,
  .toast {
    display: none !important;
  }
  
  .summary-card,
  .study-card,
  .timeline-content {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
}
</style>