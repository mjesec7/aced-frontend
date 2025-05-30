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
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="studyDays" /> Дней в обучении</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="completedSubjects" /> Завершено предметов</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="weeklyLessons" /> Уроков за неделю</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="monthlyLessons" /> Уроков за месяц</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="streakDays" /> Учебный стрик</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="mostActiveDay" /> Активный день</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="totalLessonsDone" /> Всего уроков</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="totalPoints" /> Общие очки</label>
            <label class="option-box"><input type="checkbox" v-model="selectedStats" value="avgPointsPerDay" /> Очков в день</label>
          </div>

          <div class="modal-buttons">
            <button @click="downloadPDF">📥 Скачать</button>
            <button class="cancel" @click="showModal = false">Отмена</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Summary Cards -->
    <div class="card-grid">
      <Card label="Общие очки" :value="analytics.totalPoints" subtext="Баллы за активность 💯" />
      <Card label="Очков в день" :value="analytics.avgPointsPerDay" subtext="Средний заработок 📈" />
      <Card label="Дней в обучении" :value="analytics.studyDays" :subtext="formatDaysToHuman(analytics.studyDays)" />
      <Card label="Завершено предметов" :value="analytics.completedSubjects" :subtext="`${remainingSubjects} из ${analytics.totalSubjects}`" />
      <Card label="Уроков за неделю" :value="analytics.weeklyLessons" subtext="Текущий темп 📈" />
      <Card label="Уроков за месяц" :value="analytics.monthlyLessons" subtext="Стабильность важна" />
      <Card label="Стрик" :value="`${analytics.streakDays} дней`" :subtext="analytics.streakDays > 0 ? 'Ты на волне 💫' : 'Начни снова 🚀'" />
      <Card label="Активный день" :value="analytics.mostActiveDay || 'Нет данных'" subtext="Повтори успех 💪" />
      <Card label="Всего уроков" :value="analytics.totalLessonsDone" subtext="Общий прогресс 📚" />
      <Card label="Среднее время в день" :value="analytics.averageTime || '0 мин'" subtext="Сколько ты учишься ежедневно" />
    </div>

    <!-- Recent Activity -->
    <div class="chart-box" v-if="analytics.recentActivity && analytics.recentActivity.length > 0">
      <h2 class="chart-heading">📋 Последняя активность</h2>
      <div class="recent-activity-list">
        <div v-for="activity in analytics.recentActivity" :key="activity.date" class="activity-item">
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
      <div v-for="subject in analytics.subjects" :key="subject.name" class="subject-progress">
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
          <span :class="{'quality-good': analytics.dataQuality.hasActivityData, 'quality-poor': !analytics.dataQuality.hasActivityData}">
            {{ analytics.dataQuality.hasActivityData ? '✅ Есть' : '❌ Нет' }}
          </span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Данные предметов:</span>
          <span :class="{'quality-good': analytics.dataQuality.hasSubjectData, 'quality-poor': !analytics.dataQuality.hasSubjectData}">
            {{ analytics.dataQuality.hasSubjectData ? '✅ Есть' : '❌ Нет' }}
          </span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Валидные даты:</span>
          <span class="quality-neutral">{{ analytics.dataQuality.validDates }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import LineChart from '@/components/Charts/LineChart.vue';
import Card from '@/components/Profile/AnalyticsCard.vue';
import ProgressBar from '@/components/Profile/ProgressBar.vue';
import { auth } from '@/firebase';

export default {
  name: 'UserAnalyticsPanel',
  components: { LineChart, Card, ProgressBar },
  data() {
    return {
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
    remainingSubjects() {
      return Math.max(this.analytics.totalSubjects - this.analytics.completedSubjects, 0);
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
    const id = this.user?.uid || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!id) return this.$router.push('/');
    
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Ошибка загрузки аналитики');
      
      const response = await res.json();
      console.log('📊 Analytics response:', response);
      
      // Backend returns data in nested 'data' object
      if (response.success && response.data) {
        this.analytics = { ...this.analytics, ...response.data };
      } else {
        console.warn('⚠️ Unexpected response format:', response);
      }
      
    } catch (err) {
      console.error('❌ Аналитика не получена:', err);
    }
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    downloadPDF() {
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
      wrapper.innerHTML = `<h2 style="text-align:center;font-family:'Segoe UI';margin-bottom:16px;">📊 Твоя аналитика</h2>`;
      
      this.selectedStats.forEach(key => {
        const label = labelMap[key];
        const value = this.analytics[key] ?? '—';
        wrapper.innerHTML += `<div style="margin: 10px 0; font-size: 14px;"><strong>${label}:</strong> ${value}</div>`;
      });
      
      wrapper.innerHTML += `<div style="margin-top:12px;"><strong>Период:</strong> ${this.period} дней</div>`;
      wrapper.innerHTML += `<div style="margin-top:8px;"><strong>Последнее обновление:</strong> ${this.formatDate(this.analytics.lastUpdated)}</div>`;
      
      this.showModal = false;
      
      import('html2pdf.js').then(html2pdf => {
        html2pdf.default().set({
          margin: 0.5,
          filename: 'aced-analytics.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(wrapper).save();
      });
    },
    formatDaysToHuman(days) {
      if (!days) return '0 дней';
      const y = Math.floor(days / 365);
      const m = Math.floor((days % 365) / 30);
      const d = days % 30;
      return `≈ ${[y && `${y} г.`, m && `${m} мес.`, `${d} дн.`].filter(Boolean).join(' ')}`;
    },
    formatDate(dateString) {
      if (!dateString) return '—';
      try {
        return new Date(dateString).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (err) {
        return '—';
      }
    }
  }
};
</script>

<style scoped>
@import '@/assets/css/UserAnalyticsPanel.css';

/* Additional styles for new components */
.recent-activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid #7c3aed;
}

.activity-date {
  font-size: 12px;
  color: #9ca3af;
  min-width: 80px;
}

.activity-lesson {
  flex: 1;
  margin: 0 12px;
  font-weight: 500;
}

.activity-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.points {
  color: #10b981;
}

.duration {
  color: #6366f1;
}

.data-quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.quality-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.quality-label {
  font-size: 14px;
}

.quality-good {
  color: #10b981;
  font-weight: 600;
}

.quality-poor {
  color: #ef4444;
  font-weight: 600;
}

.quality-neutral {
  color: #6b7280;
  font-weight: 500;
}
</style>