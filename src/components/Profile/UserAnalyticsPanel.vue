<template>
  <div class="analytics-panel" ref="pdfContent">
    <div class="header-row">
      <h1 class="panel-heading">📈 Твоя аналитика обучения</h1>
      <button @click="openModal" class="download-btn">Скачать как PDF</button>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Настрой экспорт PDF</h3>

          <div class="modal-section">
            <label>Выбери период:</label>
            <select v-model="period">
              <option value="7">Последняя неделя</option>
              <option value="14">2 недели</option>
              <option value="21">3 недели</option>
              <option value="30">1 месяц</option>
              <option value="90">3 месяца</option>
            </select>
          </div>

          <div class="modal-section options-grid">
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="studyDays" />
              Дней в обучении
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="completedSubjects" />
              Завершено предметов
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="weeklyLessons" />
              Уроков за неделю
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="monthlyLessons" />
              Уроков за месяц
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="streakDays" />
              Учебный стрик
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="mostActiveDay" />
              Активный день
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="totalLessonsDone" />
              Всего уроков
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="totalPoints" />
              Общие очки
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="avgPointsPerDay" />
              Очков в день
            </label>
          </div>

          <div class="modal-buttons">
            <button @click="downloadPDF">📥 Скачать</button>
            <button class="cancel" @click="showModal = false">Отмена</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загружаем твою аналитику...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="loadAnalytics" class="retry-btn">Попробовать снова</button>
    </div>

    <!-- Analytics Content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="card-grid">
        <Card 
          label="Общие очки" 
          :value="analytics.totalPoints" 
          subtext="Баллы за активность 💯" 
        />
        <Card 
          label="Очков в день" 
          :value="analytics.avgPointsPerDay" 
          subtext="Средний заработок 📈" 
        />
        <Card 
          label="Дней в обучении" 
          :value="analytics.studyDays" 
          :subtext="formatDaysToHuman(analytics.studyDays)" 
        />
        <Card 
          label="Завершено предметов" 
          :value="analytics.completedSubjects" 
          :subtext="`${remainingSubjects} из ${analytics.totalSubjects}`" 
        />
        <Card 
          label="Уроков за неделю" 
          :value="analytics.weeklyLessons" 
          subtext="Текущий темп 📈" 
        />
        <Card 
          label="Уроков за месяц" 
          :value="analytics.monthlyLessons" 
          subtext="Стабильность важна" 
        />
        <Card 
          label="Стрик" 
          :value="`${analytics.streakDays} дней`" 
          :subtext="analytics.streakDays > 0 ? 'Ты на волне 💫' : 'Начни снова 🚀'" 
        />
        <Card 
          label="Активный день" 
          :value="analytics.mostActiveDay || 'Нет данных'" 
          subtext="Повтори успех 💪" 
        />
        <Card 
          label="Всего уроков" 
          :value="analytics.totalLessonsDone" 
          subtext="Общий прогресс 📚" 
        />
        <Card 
          label="Среднее время в день" 
          :value="analytics.averageTime || '0 мин'" 
          subtext="Сколько ты учишься ежедневно" 
        />
      </div>

      <!-- Recent Activity -->
      <div class="chart-box" v-if="analytics.recentActivity && analytics.recentActivity.length > 0">
        <h2 class="chart-heading">📋 Последняя активность</h2>
        <div class="recent-activity-list">
          <div 
            v-for="activity in analytics.recentActivity" 
            :key="activity.date" 
            class="activity-item"
          >
            <div class="activity-date">{{ formatDate(activity.date) }}</div>
            <div class="activity-lesson">{{ activity.lesson }}</div>
            <div class="activity-stats">
              <span class="points">{{ activity.points }} очков</span>
              <span class="duration">{{ activity.duration }} мин</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subject Progress Bars -->
      <div class="chart-box" v-if="analytics.subjects && analytics.subjects.length > 0">
        <h2 class="chart-heading">📚 Прогресс по предметам</h2>
        <div 
          v-for="subject in analytics.subjects" 
          :key="subject.name" 
          class="subject-progress"
        >
          <div class="progress-header">
            <span class="subject-name">{{ subject.name }}</span>
            <span class="subject-value">{{ subject.progress }}%</span>
          </div>
          <ProgressBar :percent="subject.progress" />
        </div>
      </div>

      <!-- Line Chart -->
      <div class="chart-box" v-if="analytics.knowledgeChart && analytics.knowledgeChart.length > 0">
        <h2 class="chart-heading">📊 Рост знаний по месяцам</h2>
        <LineChart :chart-data="chartData" />
      </div>

      <!-- Data Quality Info -->
      <div class="chart-box" v-if="analytics.dataQuality">
        <h2 class="chart-heading">📋 Качество данных</h2>
        <div class="data-quality-grid">
          <div class="quality-item">
            <span class="quality-label">Данные активности:</span>
            <span :class="{
              'quality-good': analytics.dataQuality.hasActivityData, 
              'quality-poor': !analytics.dataQuality.hasActivityData
            }">
              {{ analytics.dataQuality.hasActivityData ? '✅ Есть' : '❌ Нет' }}
            </span>
          </div>
          <div class="quality-item">
            <span class="quality-label">Данные предметов:</span>
            <span :class="{
              'quality-good': analytics.dataQuality.hasSubjectData, 
              'quality-poor': !analytics.dataQuality.hasSubjectData
            }">
              {{ analytics.dataQuality.hasSubjectData ? '✅ Есть' : '❌ Нет' }}
            </span>
          </div>
          <div class="quality-item">
            <span class="quality-label">Валидные даты:</span>
            <span class="quality-neutral">{{ analytics.dataQuality.validDates }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!hasAnyData" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Пока нет данных для аналитики</h3>
        <p>Начни изучать уроки, чтобы увидеть свой прогресс здесь!</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { auth } from '@/firebase';
import { getUserAnalytics } from '@/api';
import LineChart from '@/components/Charts/LineChart.vue';
import Card from '@/components/Profile/AnalyticsCard.vue';
import ProgressBar from '@/components/Profile/ProgressBar.vue';

export default {
  name: 'UserAnalyticsPanel',
  components: { 
    LineChart, 
    Card, 
    ProgressBar 
  },
  data() {
    return {
      loading: true,
      error: null,
      showModal: false,
      selectedStats: [
        'studyDays',
        'completedSubjects',
        'weeklyLessons',
        'monthlyLessons',
        'streakDays',
        'mostActiveDay',
        'totalLessonsDone',
        'totalPoints',
        'avgPointsPerDay'
      ],
      period: 30,
      analytics: {
        // Basic stats from backend
        studyDays: 0,
        totalDays: 0,
        completedSubjects: 0,
        totalSubjects: 0,
        totalLessonsDone: 0,
        
        // Time-based metrics
        weeklyLessons: 0,
        monthlyLessons: 0,
        streakDays: 0,
        averageTime: '0 мин',
        
        // Points and performance
        totalPoints: 0,
        totalStars: 0,
        hintsUsed: 0,
        avgPointsPerDay: 0,
        
        // Charts and progress
        knowledgeChart: [],
        subjects: [],
        
        // Activity patterns
        mostActiveDay: null,
        recentActivity: [],
        
        // Metadata
        lastUpdated: null,
        dataQuality: {
          hasActivityData: false,
          hasSubjectData: false,
          validDates: 0
        }
      }
    };
  },
  computed: {
    ...mapState(['user']),
    ...mapGetters(['isAuthenticated']),
    
    remainingSubjects() {
      return Math.max(this.analytics.totalSubjects - this.analytics.completedSubjects, 0);
    },
    
    hasAnyData() {
      return this.analytics.totalLessonsDone > 0 || 
             this.analytics.studyDays > 0 || 
             (this.analytics.subjects && this.analytics.subjects.length > 0);
    },
    
    chartData() {
      const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      const currentMonth = new Date().getMonth();
      
      // Generate labels for last 12 months
      const labels = [];
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        labels.push(months[monthIndex]);
      }
      
      return {
        labels,
        datasets: [{
          label: 'Рост знаний',
          data: this.analytics.knowledgeChart,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          pointBackgroundColor: '#7c3aed',
          tension: 0.4,
          fill: true
        }]
      };
    }
  },
  
  async mounted() {
    await this.loadAnalytics();
  },
  
  methods: {
    // ✅ NEW: Method to fetch lesson name by ID
    async fetchLessonName(lessonId) {
      try {
        // Call your API to get lesson details
        const response = await this.$http.get(`/api/lessons/${lessonId}`);
        return response.data.title || 'Урок без названия';
      } catch (error) {
        console.error('Error fetching lesson name:', error);
        return 'Урок без названия';
      }
    },

    // ✅ NEW: Method to resolve all lesson names in recent activity
    async resolveActivityLessonNames() {
      if (!this.analytics.recentActivity || this.analytics.recentActivity.length === 0) {
        return;
      }

      // Get all activities that need lesson name resolution
      const activitiesNeedingResolution = this.analytics.recentActivity.filter(
        activity => activity.lesson && typeof activity.lesson === 'string' && activity.lesson.length === 24
      );

      if (activitiesNeedingResolution.length === 0) {
        return; // No lesson IDs to resolve
      }

      try {
        console.log('🔍 Resolving lesson names for', activitiesNeedingResolution.length, 'activities...');
        
        // Fetch all lesson names in parallel for better performance
        const lessonNamePromises = activitiesNeedingResolution.map(activity => 
          this.fetchLessonName(activity.lesson)
        );
        
        const resolvedLessonNames = await Promise.all(lessonNamePromises);

        // Update the analytics data
        const updatedActivity = this.analytics.recentActivity.map(activity => {
          const needsResolutionIndex = activitiesNeedingResolution.findIndex(
            a => a.lesson === activity.lesson
          );
          
          if (needsResolutionIndex !== -1) {
            return {
              ...activity,
              lesson: resolvedLessonNames[needsResolutionIndex],
              lessonId: activity.lesson // Keep the original ID for reference
            };
          }
          
          return activity;
        });

        this.analytics = {
          ...this.analytics,
          recentActivity: updatedActivity
        };

        console.log('✅ Lesson names resolved successfully');

      } catch (error) {
        console.error('❌ Error resolving lesson names:', error);
        // Don't break the component, just keep the IDs
      }
    },

    async loadAnalytics() {
      this.loading = true;
      this.error = null;
      
      try {
        // Wait for auth to be ready
        let currentUser = auth.currentUser;
        if (!currentUser) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          currentUser = auth.currentUser;
        }
        
        if (!currentUser) {
          console.error('❌ No authenticated user found');
          this.error = 'Необходима авторизация';
          return;
        }

        const userId = currentUser.uid;
        console.log('📊 Loading analytics for user:', userId);
        
        try {
          const response = await getUserAnalytics(userId);
          console.log('📊 Analytics response:', response);

          if (response && response.data) {
            if (response.data.success && response.data.data) {
              this.analytics = { ...this.analytics, ...response.data.data };
              console.log('✅ Analytics loaded successfully');
              
              // ✅ NEW: Resolve lesson names after loading analytics
              await this.resolveActivityLessonNames();
              
            } else if (response.data.success === false) {
              console.error('❌ Backend error:', response.data.error);
              this.error = response.data.error || 'Ошибка сервера';
              return;
            } else {
              // If response.data is the analytics object directly
              this.analytics = { ...this.analytics, ...response.data };
              console.log('✅ Analytics loaded (direct format)');
              
              // ✅ NEW: Resolve lesson names after loading analytics
              await this.resolveActivityLessonNames();
            }
          } else {
            console.warn('⚠️ No data in response');
            this.error = 'Нет данных для аналитики';
          }

        } catch (apiError) {
          console.error('❌ API Error:', apiError);
          
          if (apiError.response?.status === 401) {
            this.error = 'Ошибка авторизации. Попробуйте войти заново.';
          } else if (apiError.response?.status === 404) {
            this.error = 'Данные аналитики не найдены';
          } else if (apiError.response?.status >= 500) {
            this.error = 'Ошибка сервера. Попробуйте позже.';
          } else if (apiError.response) {
            this.error = apiError.response.data?.error || 'Ошибка загрузки данных';
          } else if (apiError.request) {
            this.error = 'Проблема с сетью. Проверьте интернет-соединение.';
          } else {
            this.error = apiError.message || 'Ошибка загрузки аналитики';
          }
          
          // Don't return here - let the component show error state
        }

      } catch (err) {
        console.error('❌ Analytics loading failed:', err);
        this.error = err.message || 'Ошибка загрузки аналитики';
      } finally {
        this.loading = false;
      }
    },
    
    openModal() {
      this.showModal = true;
    },
    
    async downloadPDF() {
      const labelMap = {
        studyDays: 'Дней в обучении',
        completedSubjects: 'Завершено предметов',
        weeklyLessons: 'Уроков за неделю',
        monthlyLessons: 'Уроков за месяц',
        streakDays: 'Учебный стрик',
        mostActiveDay: 'Активный день',
        totalLessonsDone: 'Всего уроков',
        totalPoints: 'Общие очки',
        avgPointsPerDay: 'Очков в день'
      };
      
      const wrapper = document.createElement('div');
      wrapper.style.padding = '20px';
      wrapper.style.fontFamily = 'Segoe UI, sans-serif';
      wrapper.innerHTML = `<h2 style="text-align:center;margin-bottom:20px;">📊 Твоя аналитика обучения</h2>`;
      
      this.selectedStats.forEach(key => {
        const label = labelMap[key];
        const value = this.analytics[key] ?? '—';
        wrapper.innerHTML += `
          <div style="margin: 12px 0; padding: 8px; border-left: 3px solid #7c3aed; background: #f8f9fa;">
            <strong>${label}:</strong> ${value}
          </div>
        `;
      });
      
      wrapper.innerHTML += `
        <div style="margin-top:20px; padding-top:20px; border-top: 1px solid #ddd;">
          <div style="margin: 8px 0;"><strong>Период:</strong> ${this.period} дней</div>
          <div style="margin: 8px 0;"><strong>Последнее обновление:</strong> ${this.formatDate(this.analytics.lastUpdated)}</div>
          <div style="margin: 8px 0; font-size: 12px; color: #666;">Сгенерировано: ${new Date().toLocaleString('ru-RU')}</div>
        </div>
      `;
      
      this.showModal = false;
      
      try {
        const html2pdf = await import('html2pdf.js');
        await html2pdf.default().set({
          margin: 0.5,
          filename: `aced-analytics-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(wrapper).save();
      } catch (err) {
        console.error('❌ PDF generation failed:', err);
        alert('Ошибка генерации PDF. Попробуйте позже.');
      }
    },
    
    formatDaysToHuman(days) {
      if (!days || days === 0) return '0 дней';
      
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      const remainingDays = days % 30;
      
      const parts = [];
      if (years > 0) parts.push(`${years} г.`);
      if (months > 0) parts.push(`${months} мес.`);
      if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays} дн.`);
      
      return `≈ ${parts.join(' ')}`;
    },
    
    formatDate(dateString) {
      if (!dateString) return '—';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        
        return date.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (err) {
        console.error('❌ Date formatting error:', err);
        return '—';
      }
    }
  }
};
</script>

<style scoped>
@import '@/assets/css/UserAnalyticsPanel.css';
</style>