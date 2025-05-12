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
      <Card label="Дней в обучении" :value="analytics.studyDays" :subtext="formatDaysToHuman(analytics.studyDays)" />
      <Card label="Завершено предметов" :value="analytics.completedSubjects" :subtext="`${remainingSubjects} из ${analytics.totalSubjects}`" />
      <Card label="Уроков за неделю" :value="analytics.weeklyLessons" subtext="Текущий темп 📈" />
      <Card label="Уроков за месяц" :value="analytics.monthlyLessons" subtext="Стабильность важна" />
      <Card label="Стрик" :value="`${analytics.streakDays} дней`" :subtext="analytics.streakDays > 0 ? 'Ты на волне 💫' : 'Начни снова 🚀'" />
      <Card label="Активный день" :value="analytics.mostActiveDay || 'Нет данных'" subtext="Повтори успех 💪" />
      <Card label="Всего уроков" :value="analytics.totalLessonsDone" subtext="Общий прогресс 📚" />
      <Card label="Среднее время в день" :value="analytics.averageTime || '0 мин'" subtext="Сколько ты учишься ежедневно" />
      <Card label="Дата начала" :value="analytics.firstLessonDate || '—'" subtext="Когда ты начал учиться" />
      <Card label="Лучшая неделя" :value="analytics.bestWeek || '—'" subtext="Неделя с лучшим прогрессом" />
      <Card label="Цель месяца" :value="analytics.monthlyGoalProgress + '%'" subtext="Прогресс выполнения цели" />
      <Card label="Медали" :value="analytics.medalsEarned.join(', ') || '—'" subtext="Заработанные награды" />
      <Card label="XP и уровень" :value="`Lv ${analytics.level} — ${analytics.xp} XP`" subtext="Твоя прокачка 💥" />
      <Card label="Процент возвратов к темам" :value="analytics.revisitRate + '%'" subtext="Повторение — мать учения" />
      <Card label="Процент завершения уроков" :value="analytics.lessonCompletionRate + '%'" subtext="Завершенные из начатых" />
      <Card label="Точность на тестах" :value="analytics.quizAccuracyRate + '%'" subtext="Правильные ответы на квизы" />
    </div>

    <!-- Subject Progress Bars -->
    <div class="chart-box">
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
    <div class="chart-box">
      <h2 class="chart-heading">📊 Рост знаний по месяцам</h2>
      <LineChart :chart-data="chartData" />
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
        'totalLessonsDone'
      ],
      period: 30,
      analytics: {
      showModal: false,
      selectedStats: [
        'studyDays',
        'completedSubjects',
        'weeklyLessons',
        'monthlyLessons',
        'streakDays',
        'mostActiveDay',
        'totalLessonsDone'
      ],
      
        studyDays: 0,
        completedSubjects: 0,
        totalSubjects: 0,
        weeklyLessons: 0,
        monthlyLessons: 0,
        streakDays: 0,
        mostActiveDay: null,
        totalLessonsDone: 0,
        averageTime: '0 мин',
        knowledgeChart: [],
        subjects: [],
        firstLessonDate: null,
        bestWeek: null,
        monthlyGoalProgress: 0,
        medalsEarned: [],
        xp: 0,
        level: 1,
        revisitRate: 0,
        lessonCompletionRate: 0,
        quizAccuracyRate: 0,
        averageQuizAttempts: 0,
        failedQuizzes: 0,
        passedQuizzes: 0,
        totalMistakes: 0,
        mostChallengingSubject: null,
        longestSession: 0,
        timeOfDayActivity: {
          morning: 0,
          afternoon: 0,
          evening: 0
        },
        globalRank: null,
        progressTrend: []
      }
    };
  },
  computed: {
    ...mapState(['user']),
    remainingSubjects() {
      return Math.max(this.analytics.totalSubjects - this.analytics.completedSubjects, 0);
    },
    chartData() {
      const trendData = this.analytics.progressTrend.length ? this.analytics.progressTrend : this.analytics.knowledgeChart;
      return {
        labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
        datasets: [{
          label: 'Рост знаний',
          data: trendData,
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
      const data = response?.studyDays !== undefined ? response : {};
      this.analytics = {
        ...this.analytics,
        ...data
      };
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
        totalLessonsDone: 'Всего уроков'
      };
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `<h2 style="text-align:center;font-family:'Segoe UI';margin-bottom:16px;">📊 Твоя аналитика</h2>`;
      this.selectedStats.forEach(key => {
        const label = labelMap[key];
        const value = this.analytics[key] ?? '—';
        wrapper.innerHTML += `<div style="margin: 10px 0; font-size: 14px;"><strong>${label}:</strong> ${value}</div>`;
      });
      wrapper.innerHTML += `<div style="margin-top:12px;"><strong>Период:</strong> ${this.period} дней</div>`;
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
      const y = Math.floor(days / 365);
      const m = Math.floor((days % 365) / 30);
      const d = days % 30;
      return `≈ ${[y && `${y} г.`, m && `${m} мес.`, `${d} дн.`].filter(Boolean).join(' ')}`;
    }
  }
};
</script>

<style scoped>
@import '@/assets/css/UserAnalyticsPanel.css';
</style>
