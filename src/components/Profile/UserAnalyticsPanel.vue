<template>
  <div class="analytics-panel" ref="pdfContent">
    <div class="header-row">
      <h1 class="panel-heading">Твоя аналитика обучения</h1>
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

    <div class="card-grid">
      <Card label="Дней в обучении" :value="`${analytics.studyDays}`" :subtext="formatDaysToHuman(analytics.studyDays)" />
      <Card label="Завершено предметов" :value="analytics.completedSubjects.toString()" :subtext="`${remainingSubjects} осталось из ${analytics.totalSubjects}`" />
      <Card label="Уроков за неделю" :value="analytics.weeklyLessons.toString()" subtext="Это твой текущий темп 📈" />
      <Card label="Уроков за месяц" :value="analytics.monthlyLessons.toString()" subtext="Стабильность — ключ к успеху" />
      <Card label="Учебный стрик" :value="`${analytics.streakDays} дней`" :subtext="analytics.streakDays > 0 ? 'Ты на волне 💫' : 'Пора начать снова 🚀'" />
      <Card label="Наиболее активный день" :value="analytics.mostActiveDay || 'Нет данных'" subtext="Продолжай в этот день 💪" />
      <Card label="Пройдено уроков всего" :value="analytics.totalLessonsDone.toString()" subtext="Общий прогресс 📚" />
    </div>

    <div class="chart-box">
      <h2 class="chart-heading">Рост знаний по месяцам</h2>
      <LineChart :chart-data="chartData" />
    </div>

    <div class="chart-box">
      <h2 class="chart-heading">Прогресс по предметам</h2>
      <div v-for="subject in analytics.subjects" :key="subject.name" class="subject-progress">
        <div class="progress-header">
          <span class="subject-name">{{ subject.name }}</span>
          <span class="subject-value">{{ subject.progress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: subject.progress + '%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { auth } from '@/firebase'; // ✅ import Firebase auth
import LineChart from '@/components/Charts/LineChart.vue';
import Card from '@/components/Profile/AnalyticsCard.vue';
import html2pdf from 'html2pdf.js';
import '@/assets/css/UserAnalyticsPanel.css';

export default {
  components: { LineChart, Card },
  data() {
    return {
      analytics: {
        studyDays: 0,
        totalDays: 365,
        completedSubjects: 0,
        totalSubjects: 0,
        weeklyLessons: 0,
        monthlyLessons: 0,
        streakDays: 0,
        averageTime: '0 мин',
        knowledgeChart: [],
        subjects: [],
        mostActiveDay: null,
        totalLessonsDone: 0
      },
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
      userId: null
    };
  },
  computed: {
    ...mapState(['user']),
    remainingSubjects() {
      return Math.max(this.analytics.totalSubjects - this.analytics.completedSubjects, 0);
    },
    chartData() {
      return {
        labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
        datasets: [
          {
            label: 'Рост знаний',
            data: this.analytics.knowledgeChart,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            pointBackgroundColor: '#7c3aed',
            pointRadius: 4,
            tension: 0.4,
            fill: true
          }
        ]
      };
    }
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    formatDaysToHuman(days) {
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      const remainingDays = days % 30;
      const parts = [];
      if (years > 0) parts.push(`${years} г.`);
      if (months > 0) parts.push(`${months} мес.`);
      if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays} дн.`);
      return `≈ ${parts.join(' ')}`;
    },
    downloadPDF() {
      const labelMap = {
        studyDays: 'Дней в обучении',
        completedSubjects: 'Завершено предметов',
        weeklyLessons: 'Уроков за неделю',
        monthlyLessons: 'Уроков за месяц',
        streakDays: 'Учебный стрик',
        mostActiveDay: 'Наиболее активный день',
        totalLessonsDone: 'Всего уроков'
      };
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `<h2 style="text-align:center;font-family:'Segoe UI';margin-bottom:16px;">📊 Your Results in Aced</h2>`;
      this.selectedStats.forEach(key => {
        const label = labelMap[key];
        const value = this.analytics[key] ?? '—';
        wrapper.innerHTML += `<div style="margin: 10px 0; font-size: 14px;"><strong>${label}:</strong> ${value}</div>`;
      });
      wrapper.innerHTML += `<div style="margin-top:12px;"><strong>Период:</strong> Последние ${this.period} дней</div>`;
      this.showModal = false;
      html2pdf().set({
        margin: 0.5,
        filename: 'aced-analytics-custom.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).from(wrapper).save();
    }
  },
  async mounted() {
    const storedId = this.user?.uid || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) {
      console.error('❌ Нет userId. Перенаправляем на главную...');
      return this.$router.push('/');
    }
    this.userId = storedId;

    try {
      const token = await auth.currentUser.getIdToken(); // ✅ secure token
      const res = await fetch(`${process.env.VUE_APP_API_URL}/user-analytics/${this.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('❌ Ошибка ответа сервера при получении аналитики');
      const data = await res.json();
      this.analytics = data;
    } catch (err) {
      console.error('❌ Ошибка при получении аналитики:', err);
    }
  }
};
</script>


