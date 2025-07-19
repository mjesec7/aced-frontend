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
              <input type="checkbox" v-model="selectedStats" value="completedLessons" />
              Завершено уроков
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="completedTopics" />
              Завершено тем
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
          :value="formatNumber(analytics.totalPoints)" 
          subtext="Баллы за активность 💯" 
        />
        <Card 
          label="Очков в день" 
          :value="formatNumber(analytics.avgPointsPerDay)" 
          subtext="Средний заработок 📈" 
        />
        <Card 
          label="Дней в обучении" 
          :value="formatNumber(analytics.studyDays)" 
          :subtext="formatDaysToHuman(analytics.studyDays)" 
        />
        <Card 
          label="Завершено уроков" 
          :value="formatNumber(analytics.completedLessons || analytics.totalLessonsDone)" 
          subtext="Пройденные уроки 📚" 
        />
        <Card 
          label="Завершено тем" 
          :value="formatNumber(analytics.completedTopics || analytics.completedSubjects)" 
          :subtext="analytics.totalTopics ? `${analytics.totalTopics - (analytics.completedTopics || analytics.completedSubjects)} осталось` : 'Продолжай изучать 🚀'" 
        />
        <Card 
          label="Уроков за неделю" 
          :value="formatNumber(analytics.weeklyLessons)" 
          subtext="Текущий темп 📈" 
        />
        <Card 
          label="Уроков за месяц" 
          :value="formatNumber(analytics.monthlyLessons)" 
          subtext="Стабильность важна" 
        />
        <Card 
          label="Стрик" 
          :value="analytics.streakDays > 0 ? `${analytics.streakDays} дней` : '0 дней'" 
          :subtext="analytics.streakDays > 0 ? 'Ты на волне 💫' : 'Начни снова 🚀'" 
        />
        <Card 
          label="Активный день" 
          :value="analytics.mostActiveDay || 'Нет данных'" 
          subtext="Повтори успех 💪" 
        />
        <Card 
          label="Среднее время в день" 
          :value="formatTime(analytics.averageTime)" 
          subtext="Ежедневная продолжительность обучения ⏰" 
        />
      </div>

      <!-- Recent Activity -->
      <div class="chart-box" v-if="analytics.recentActivity && analytics.recentActivity.length > 0">
        <h2 class="chart-heading">📋 Последняя активность</h2>
        <div class="recent-activity-list">
          <div 
            v-for="(activity, index) in analytics.recentActivity" 
            :key="`activity-${index}-${activity.date}`" 
            class="activity-item"
          >
            <div class="activity-date">{{ formatDate(activity.date) }}</div>
            <div class="activity-lesson">{{ formatLessonName(activity.lesson) }}</div>
            <div class="activity-stats">
              <span class="points">{{ formatNumber(activity.points) }} очков</span>
              <span class="duration" v-if="activity.duration">{{ formatDuration(activity.duration) }}</span>
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
            <span class="subject-value">{{ Math.round(subject.progress) }}%</span>
          </div>
          <ProgressBar :percent="subject.progress" />
        </div>
      </div>

      <!-- Topic Progress -->
      <div class="chart-box" v-if="analytics.topics && analytics.topics.length > 0">
        <h2 class="chart-heading">🎯 Прогресс по темам</h2>
        <div 
          v-for="topic in analytics.topics" 
          :key="topic.name" 
          class="topic-progress"
        >
          <div class="progress-header">
            <span class="topic-name">{{ topic.name }}</span>
            <span class="topic-value">{{ topic.completedLessons || 0 }} / {{ topic.totalLessons || 0 }} уроков</span>
          </div>
          <ProgressBar :percent="calculateTopicProgress(topic)" />
        </div>
      </div>

      <!-- Line Chart -->
      <div class="chart-box" v-if="analytics.knowledgeChart && analytics.knowledgeChart.length > 0">
        <h2 class="chart-heading">📊 Рост знаний по месяцам</h2>
        <LineChart :chart-data="chartData" />
      </div>

      <!-- Performance Metrics -->
      <div class="chart-box">
        <h2 class="chart-heading">🏆 Показатели эффективности</h2>
        <div class="performance-grid">
          <div class="performance-item">
            <div class="performance-label">Точность ответов</div>
            <div class="performance-value">{{ calculateAccuracy() }}%</div>
          </div>
          <div class="performance-item">
            <div class="performance-label">Средний балл за урок</div>
            <div class="performance-value">{{ calculateAvgScore() }}</div>
          </div>
          <div class="performance-item">
            <div class="performance-label">Использовано подсказок</div>
            <div class="performance-value">{{ formatNumber(analytics.hintsUsed || 0) }}</div>
          </div>
          <div class="performance-item">
            <div class="performance-label">Заработано звёзд</div>
            <div class="performance-value">{{ formatNumber(analytics.totalStars || 0) }} ⭐</div>
          </div>
        </div>
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
            <span class="quality-label">Валидные записи:</span>
            <span class="quality-neutral">{{ formatNumber(analytics.dataQuality.validDates || 0) }}</span>
          </div>
          <div class="quality-item">
            <span class="quality-label">Последнее обновление:</span>
            <span class="quality-neutral">{{ formatDate(analytics.lastUpdated) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!hasAnyData" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Пока нет данных для аналитики</h3>
        <p>Начни изучать уроки, чтобы увидеть свой прогресс здесь!</p>
        <button @click="$router.push('/catalogue')" class="start-learning-btn">
          🚀 Начать обучение
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { auth } from '@/firebase';
import { getUserAnalytics, getLessonById } from '@/api';
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
        'completedLessons',
        'completedTopics',
        'weeklyLessons',
        'monthlyLessons',
        'streakDays',
        'mostActiveDay',
        'totalLessonsDone',
        'totalPoints',
        'avgPointsPerDay'
      ],
      period: 30,
      lessonCache: new Map(), // Cache for lesson names
      analytics: {
        // Basic stats from backend
        studyDays: 0,
        totalDays: 0,
        completedLessons: 0,
        completedTopics: 0,
        completedSubjects: 0,
        totalSubjects: 0,
        totalTopics: 0,
        totalLessonsDone: 0,
        
        // Time-based metrics
        weeklyLessons: 0,
        monthlyLessons: 0,
        streakDays: 0,
        averageTime: 0,
        
        // Points and performance
        totalPoints: 0,
        totalStars: 0,
        hintsUsed: 0,
        avgPointsPerDay: 0,
        
        // Charts and progress
        knowledgeChart: [],
        subjects: [],
        topics: [],
        
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
    
    hasAnyData() {
      return this.analytics.totalLessonsDone > 0 || 
             this.analytics.studyDays > 0 || 
             (this.analytics.subjects && this.analytics.subjects.length > 0) ||
             (this.analytics.topics && this.analytics.topics.length > 0);
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
      
      // Ensure we have data for all 12 months
      const chartData = Array.isArray(this.analytics.knowledgeChart) 
        ? this.analytics.knowledgeChart 
        : [];
      
      // Pad with zeros if we don't have enough data
      while (chartData.length < 12) {
        chartData.unshift(0);
      }
      
      return {
        labels,
        datasets: [{
          label: 'Рост знаний (%)',
          data: chartData.slice(-12), // Take last 12 months
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
    // ✅ FIXED: Method to fetch lesson name by ID using proper API
    async fetchLessonName(lessonId) {
      // Check cache first
      if (this.lessonCache.has(lessonId)) {
        return this.lessonCache.get(lessonId);
      }
      
      try {
        console.log('🔍 Fetching lesson name for ID:', lessonId);
        const response = await getLessonById(lessonId);
        
        let lessonName = 'Урок без названия';
        
        if (response.success && response.data) {
          lessonName = response.data.lessonName || 
                      response.data.title || 
                      response.data.name || 
                      'Урок без названия';
        } else if (response.data) {
          lessonName = response.data.lessonName || 
                      response.data.title || 
                      response.data.name || 
                      'Урок без названия';
        }
        
        // Cache the result
        this.lessonCache.set(lessonId, lessonName);
        console.log('✅ Lesson name cached:', lessonName);
        
        return lessonName;
        
      } catch (error) {
        console.error('❌ Error fetching lesson name for', lessonId, ':', error);
        const fallbackName = `Урок (${lessonId.slice(-6)})`;
        this.lessonCache.set(lessonId, fallbackName);
        return fallbackName;
      }
    },

    // ✅ IMPROVED: Method to resolve all lesson names in recent activity
    async resolveActivityLessonNames() {
      if (!this.analytics.recentActivity || this.analytics.recentActivity.length === 0) {
        return;
      }

      console.log('🔍 Starting lesson name resolution...');
      
      // Get all activities that need lesson name resolution (ObjectId-like strings)
      const activitiesNeedingResolution = this.analytics.recentActivity.filter(activity => {
        const lesson = activity.lesson;
        return lesson && 
               typeof lesson === 'string' && 
               lesson.length === 24 && 
               /^[a-f\d]{24}$/i.test(lesson); // MongoDB ObjectId pattern
      });

      if (activitiesNeedingResolution.length === 0) {
        console.log('ℹ️ No lesson IDs need resolution');
        return;
      }

      console.log(`🔍 Resolving ${activitiesNeedingResolution.length} lesson names...`);
      
      try {
        // Process in batches to avoid overwhelming the API
        const batchSize = 5;
        const batches = [];
        
        for (let i = 0; i < activitiesNeedingResolution.length; i += batchSize) {
          batches.push(activitiesNeedingResolution.slice(i, i + batchSize));
        }
        
        // Process each batch
        for (const batch of batches) {
          const batchPromises = batch.map(activity => 
            this.fetchLessonName(activity.lesson)
          );
          
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Update activities with resolved names
          batch.forEach((activity, index) => {
            const result = batchResults[index];
            if (result.status === 'fulfilled') {
              // Find the activity in the main array and update it
              const activityIndex = this.analytics.recentActivity.findIndex(
                a => a.lesson === activity.lesson && a.date === activity.date
              );
              
              if (activityIndex !== -1) {
                this.analytics.recentActivity[activityIndex] = {
                  ...this.analytics.recentActivity[activityIndex],
                  lesson: result.value,
                  originalLessonId: activity.lesson
                };
              }
            }
          });
          
          // Small delay between batches to be nice to the API
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        console.log('✅ Lesson name resolution completed');

      } catch (error) {
        console.error('❌ Error during lesson name resolution:', error);
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
              console.log('✅ Analytics loaded successfully (wrapped format)');
            } else if (response.data.success === false) {
              console.error('❌ Backend error:', response.data.error);
              this.error = response.data.error || 'Ошибка сервера';
              return;
            } else {
              // If response.data is the analytics object directly
              this.analytics = { ...this.analytics, ...response.data };
              console.log('✅ Analytics loaded successfully (direct format)');
            }
            
            // ✅ Resolve lesson names after loading analytics
            await this.resolveActivityLessonNames();
            
          } else {
            console.warn('⚠️ No data in response');
            this.error = 'Нет данных для аналитики';
          }

        } catch (apiError) {
          console.error('❌ API Error:', apiError);
          
          if (apiError.response?.status === 401) {
            this.error = 'Ошибка авторизации. Попробуйте войти заново.';
          } else if (apiError.response?.status === 404) {
            this.error = 'Данные аналитики не найдены. Начните изучать уроки!';
          } else if (apiError.response?.status >= 500) {
            this.error = 'Ошибка сервера. Попробуйте позже.';
          } else if (apiError.response) {
            this.error = apiError.response.data?.error || 'Ошибка загрузки данных';
          } else if (apiError.request) {
            this.error = 'Проблема с сетью. Проверьте интернет-соединение.';
          } else {
            this.error = apiError.message || 'Ошибка загрузки аналитики';
          }
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
        completedLessons: 'Завершено уроков',
        completedTopics: 'Завершено тем',
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
        let value = this.analytics[key] ?? '—';
        
        // Format specific values
        if (key === 'completedLessons' && !this.analytics[key]) {
          value = this.analytics.totalLessonsDone ?? '—';
        }
        if (key === 'completedTopics' && !this.analytics[key]) {
          value = this.analytics.completedSubjects ?? '—';
        }
        
        wrapper.innerHTML += `
          <div style="margin: 12px 0; padding: 8px; border-left: 3px solid #7c3aed; background: #f8f9fa;">
            <strong>${label}:</strong> ${this.formatNumber(value)}
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
    
    // ✅ NEW: Helper methods for better formatting
    formatNumber(value) {
      if (value === null || value === undefined || value === '') return '—';
      if (typeof value === 'string' && isNaN(Number(value))) return value;
      
      const num = Number(value);
      if (isNaN(num)) return '—';
      
      return num.toLocaleString('ru-RU');
    },
    
    formatTime(timeValue) {
      if (!timeValue) return '0 мин';
      
      // If it's already a formatted string
      if (typeof timeValue === 'string' && timeValue.includes('мин')) {
        return timeValue;
      }
      
      // If it's a number (minutes)
      const minutes = Number(timeValue);
      if (isNaN(minutes)) return '0 мин';
      
      if (minutes < 60) {
        return `${Math.round(minutes)} мин`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}м` : `${hours}ч`;
      }
    },
    
    formatDuration(duration) {
      if (!duration) return '';
      
      const minutes = Number(duration);
      if (isNaN(minutes)) return duration;
      
      return `${Math.round(minutes)} мин`;
    },
    
    formatLessonName(lesson) {
      if (!lesson) return 'Урок без названия';
      
      // If it's still an ID (24 characters, alphanumeric)
      if (typeof lesson === 'string' && lesson.length === 24 && /^[a-f\d]{24}$/i.test(lesson)) {
        return `Урок (${lesson.slice(-6)})`;
      }
      
      return lesson;
    },
    
    calculateTopicProgress(topic) {
      if (!topic.totalLessons || topic.totalLessons === 0) return 0;
      return Math.round((topic.completedLessons / topic.totalLessons) * 100);
    },
    
    calculateAccuracy() {
      // Calculate based on total correct vs total attempts
      const totalAttempts = (this.analytics.totalCorrect || 0) + (this.analytics.totalMistakes || 0);
      if (totalAttempts === 0) return 0;
      return Math.round(((this.analytics.totalCorrect || 0) / totalAttempts) * 100);
    },
    
    calculateAvgScore() {
      if (!this.analytics.totalLessonsDone || this.analytics.totalLessonsDone === 0) return 0;
      return Math.round((this.analytics.totalPoints || 0) / this.analytics.totalLessonsDone);
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
        
        // Check if date is today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) {
          return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Check if date is yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();
        
        if (isYesterday) {
          return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Check if date is within this week
        const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
          const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
          return `${dayNames[date.getDay()]}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Otherwise show full date
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