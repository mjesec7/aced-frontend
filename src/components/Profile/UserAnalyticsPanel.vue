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
              <input type="checkbox" v-model="selectedStats" value="totalLessonsDone" />
              Всего уроков пройдено
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
              Дней подряд
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="averageTime" />
              Среднее время
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="totalPoints" />
              Всего очков
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="avgPointsPerDay" />
              Очков в день
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="mostActiveDay" />
              Самый активный день
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="knowledgeChart" />
              График знаний
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="subjects" />
              Прогресс по предметам
            </label>
            <label class="option-box">
              <input type="checkbox" v-model="selectedStats" value="recentActivity" />
              Последняя активность
            </label>
          </div>

          <div class="modal-actions">
            <button @click="generateAndDownloadPdf" class="btn-primary">
              <span v-if="generatingPdf">Генерация PDF...</span>
              <span v-else>Скачать PDF</span>
            </button>
            <button @click="sendPdfByEmail" class="btn-secondary" :disabled="!userEmail || sendingEmail">
              <span v-if="sendingEmail">Отправка...</span>
              <span v-else>Отправить на почту</span>
            </button>
            <button @click="showModal = false" class="btn-cancel">Отмена</button>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка аналитики...</p>
    </div>

    <div v-else-if="!analytics.data" class="empty-state">
      <p>Нет данных для отображения. Начните обучение, чтобы увидеть свою аналитику!</p>
      <button @click="fetchAnalytics" class="refresh-btn">Обновить</button>
    </div>

    <div v-else class="analytics-content">
      <!-- Main Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <p class="stat-label">Дней в обучении</p>
          <p class="stat-value">{{ formatDaysToHuman(analytics.data.studyDays) }}</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <p class="stat-label">Завершено предметов</p>
          <p class="stat-value">{{ analytics.data.completedSubjects }} / {{ analytics.data.totalSubjects }}</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <p class="stat-label">Всего уроков пройдено</p>
          <p class="stat-value">{{ analytics.data.totalLessonsDone }}</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <p class="stat-label">Дней подряд (стрик)</p>
          <p class="stat-value">{{ analytics.data.streakDays }} дн.</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <p class="stat-label">Среднее время сессии</p>
          <p class="stat-value">{{ analytics.data.averageTime }}</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <p class="stat-label">Всего очков</p>
          <p class="stat-value">{{ analytics.data.totalPoints }}</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <p class="stat-label">Очков в день (в среднем)</p>
          <p class="stat-value">{{ analytics.data.avgPointsPerDay }}</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🗓️</div>
          <p class="stat-label">Самый активный день</p>
          <p class="stat-value">{{ analytics.data.mostActiveDay }}</p>
        </div>
      </div>

      <!-- Charts and Lists -->
      <div class="charts-and-lists">
        <div class="chart-card full-width">
          <h2>📊 График знаний (очки за месяц)</h2>
          <canvas ref="knowledgeChart"></canvas>
        </div>

        <div class="list-card">
          <h2>📚 Прогресс по предметам</h2>
          <ul class="subject-progress-list">
            <li v-for="subject in analytics.data.subjects" :key="subject.name">
              <span>{{ subject.name }}</span>
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: subject.progress + '%' }"></div>
                <span class="progress-text">{{ subject.progress }}%</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="list-card">
          <h2>⚡ Последняя активность</h2>
          <ul class="recent-activity-list">
            <li v-for="(activity, index) in analytics.data.recentActivity" :key="index">
              <span class="activity-date">{{ formatDate(activity.date) }}</span>
              <!-- FIX: Display topic name here -->
              <span class="activity-lesson-topic">
                {{ activity.lesson }} <span v-if="activity.topic">({{ activity.topic }})</span>
              </span>
              <span class="activity-points">{{ activity.points }} очков</span>
              <span class="activity-duration">{{ formatDuration(activity.duration) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// IMPORTANT: If you are seeing "SyntaxError: Cannot use import statement outside a module"
// This error is a Node.js (backend) error, not a frontend Vue.js error.
// It means a backend JavaScript file is using 'import' syntax but is being run
// as a CommonJS module. Check your backend files (e.g., config/firebase.js, server.js)
// and ensure they consistently use 'require' for modules, or configure your Node.js
// project for ES Modules (e.g., by adding "type": "module" to package.json).
// This frontend Vue component's imports are correct for the browser environment.
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import html2pdf from 'html2pdf.js';
import { auth } from '@/firebase'; // Import auth from firebase

Chart.register(...registerables);

export default {
  name: 'UserAnalyticsPanel',
  data() {
    return {
      userId: null,
      userEmail: '',
      loading: true,
      generatingPdf: false,
      sendingEmail: false,
      analytics: {
        data: null,
      },
      knowledgeChartInstance: null,
      showModal: false,
      period: '30', // Default period for PDF export
      selectedStats: [ // Default selected stats for PDF export
        'studyDays', 'completedSubjects', 'totalLessonsDone', 'weeklyLessons',
        'monthlyLessons', 'streakDays', 'averageTime', 'totalPoints',
        'avgPointsPerDay', 'mostActiveDay', 'knowledgeChart', 'subjects', 'recentActivity'
      ],
    };
  },
  async mounted() {
    // Listen for auth state changes to get the user ID
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userId = user.uid;
        this.userEmail = user.email; // Get user email for sending reports
        await this.fetchAnalytics();
      } else {
        this.userId = null;
        this.userEmail = '';
        this.loading = false;
        this.analytics.data = null; // Clear data if user logs out
        console.warn('⚠️ No user authenticated for analytics panel.');
      }
    });
  },
  methods: {
    async fetchAnalytics() {
      if (!this.userId) {
        console.warn('Skipping analytics fetch: userId is null.');
        this.loading = false;
        return;
      }

      this.loading = true;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user found during analytics fetch.');
          this.loading = false;
          return;
        }
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/analytics/${this.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.analytics.data = response.data.data;
        console.log('✅ Analytics data fetched:', this.analytics.data);
        this.$nextTick(() => {
          this.renderKnowledgeChart();
        });
      } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        this.analytics.data = null; // Ensure data is cleared on error
        // Use a custom message box or toast instead of alert
        this.showErrorMessage('Ошибка загрузки аналитики. Пожалуйста, попробуйте позже.');
      } finally {
        this.loading = false;
      }
    },

    renderKnowledgeChart() {
      if (this.knowledgeChartInstance) {
        this.knowledgeChartInstance.destroy();
      }

      const ctx = this.$refs.knowledgeChart.getContext('2d');
      const data = this.analytics.data.knowledgeChart;

      const labels = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }));
      }

      this.knowledgeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Очки',
            data: data,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#8b5cf6',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              title: {
                display: true,
                text: 'Месяц'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: '#e9ecef'
              },
              title: {
                display: true,
                text: 'Очки'
              }
            }
          }
        }
      });
    },

    openModal() {
      this.showModal = true;
    },

    async generateAndDownloadPdf() {
      this.generatingPdf = true;
      try {
        const element = this.$refs.pdfContent;
        const opt = {
          margin: 1,
          filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Create a temporary div with only selected content for PDF
        const tempDiv = document.createElement('div');
        tempDiv.style.padding = '1rem';
        tempDiv.style.fontFamily = 'Inter, sans-serif';
        tempDiv.style.color = '#333';

        const addSection = (title, contentHtml) => {
          tempDiv.innerHTML += `<h2 style="color:#8b5cf6; margin-top:1.5rem; margin-bottom:0.8rem; font-size:1.2rem;">${title}</h2>`;
          tempDiv.innerHTML += contentHtml;
        };

        // Add header
        tempDiv.innerHTML += `<h1 style="text-align:center; color:#212529; font-size:1.8rem; margin-bottom:1rem;">Твоя аналитика обучения</h1>`;
        tempDiv.innerHTML += `<p style="text-align:center; color:#6c757d; font-size:0.9rem; margin-bottom:2rem;">Отчет сгенерирован: ${new Date().toLocaleDateString('ru-RU')}</p>`;

        // Add selected stats
        const statsHtml = `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:1rem; margin-bottom:1.5rem;">
          ${this.selectedStats.includes('studyDays') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Дней в обучении</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.formatDaysToHuman(this.analytics.data.studyDays)}</p></div>` : ''}
          ${this.selectedStats.includes('completedSubjects') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Завершено предметов</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.completedSubjects} / ${this.analytics.data.totalSubjects}</p></div>` : ''}
          ${this.selectedStats.includes('totalLessonsDone') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Всего уроков пройдено</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.totalLessonsDone}</p></div>` : ''}
          ${this.selectedStats.includes('streakDays') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Дней подряд (стрик)</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.streakDays} дн.</p></div>` : ''}
          ${this.selectedStats.includes('averageTime') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Среднее время сессии</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.averageTime}</p></div>` : ''}
          ${this.selectedStats.includes('totalPoints') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Всего очков</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.totalPoints}</p></div>` : ''}
          ${this.selectedStats.includes('avgPointsPerDay') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Очков в день (в среднем)</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.avgPointsPerDay}</p></div>` : ''}
          ${this.selectedStats.includes('mostActiveDay') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Самый активный день</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.mostActiveDay}</p></div>` : ''}
        </div>`;
        tempDiv.innerHTML += statsHtml;

        // Add subjects progress
        if (this.selectedStats.includes('subjects') && this.analytics.data.subjects && this.analytics.data.subjects.length > 0) {
          let subjectsHtml = '<ul style="list-style:none; padding:0;">';
          this.analytics.data.subjects.forEach(subject => {
            subjectsHtml += `<li style="margin-bottom:0.8rem; font-size:0.9rem; color:#495057;">
              <span style="display:block; margin-bottom:0.2rem;">${subject.name}</span>
              <div style="background:#e9ecef; border-radius:4px; height:6px; overflow:hidden;">
                <div style="width:${subject.progress}%; height:100%; background:#8b5cf6; border-radius:4px;"></div>
              </div>
              <span style="display:block; text-align:right; font-size:0.8rem; color:#6c757d; margin-top:0.2rem;">${subject.progress}%</span>
            </li>`;
          });
          subjectsHtml += '</ul>';
          addSection('Прогресс по предметам', subjectsHtml);
        }

        // Add recent activity
        if (this.selectedStats.includes('recentActivity') && this.analytics.data.recentActivity && this.analytics.data.recentActivity.length > 0) {
          let activityHtml = '<ul style="list-style:none; padding:0;">';
          this.analytics.data.recentActivity.forEach(activity => {
            // FIX: Include topic name in PDF recent activity
            const topicDisplay = activity.topic ? ` (${activity.topic})` : '';
            activityHtml += `<li style="margin-bottom:0.6rem; font-size:0.9rem; color:#495057;">
              <span style="font-weight:600;">${this.formatDate(activity.date)}:</span> ${activity.lesson}${topicDisplay} - ${activity.points} очков, ${this.formatDuration(activity.duration)}
            </li>`;
          });
          activityHtml += '</ul>';
          addSection('Последняя активность', activityHtml);
        }

        // Add chart (as image if possible, or skip if complex)
        if (this.selectedStats.includes('knowledgeChart') && this.knowledgeChartInstance) {
          const chartImage = this.knowledgeChartInstance.toBase64Image();
          addSection('График знаний', `<img src="${chartImage}" style="width:100%; height:auto; margin-top:1rem; border:1px solid #e9ecef; border-radius:8px;"/>`);
        }

        await html2pdf().set(opt).from(tempDiv).save();
      } catch (err) {
        console.error('❌ PDF generation failed:', err);
        this.showErrorMessage('Ошибка генерации PDF. Попробуйте позже.');
      } finally {
        this.generatingPdf = false;
        this.showModal = false; // Close modal after action
      }
    },

    async sendPdfByEmail() {
      this.sendingEmail = true;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          this.showErrorMessage('Для отправки отчета необходимо войти в аккаунт.');
          this.sendingEmail = false;
          return;
        }
        const token = await currentUser.getIdToken();

        const element = this.$refs.pdfContent;
        const opt = {
          margin: 1,
          filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Create a temporary div with only selected content for PDF
        const tempDiv = document.createElement('div');
        tempDiv.style.padding = '1rem';
        tempDiv.style.fontFamily = 'Inter, sans-serif';
        tempDiv.style.color = '#333';

        const addSection = (title, contentHtml) => {
          tempDiv.innerHTML += `<h2 style="color:#8b5cf6; margin-top:1.5rem; margin-bottom:0.8rem; font-size:1.2rem;">${title}</h2>`;
          tempDiv.innerHTML += contentHtml;
        };

        // Add header
        tempDiv.innerHTML += `<h1 style="text-align:center; color:#212529; font-size:1.8rem; margin-bottom:1rem;">Твоя аналитика обучения</h1>`;
        tempDiv.innerHTML += `<p style="text-align:center; color:#6c757d; font-size:0.9rem; margin-bottom:2rem;">Отчет сгенерирован: ${new Date().toLocaleDateString('ru-RU')}</p>`;

        // Add selected stats
        const statsHtml = `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:1rem; margin-bottom:1.5rem;">
          ${this.selectedStats.includes('studyDays') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Дней в обучении</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.formatDaysToHuman(this.analytics.data.studyDays)}</p></div>` : ''}
          ${this.selectedStats.includes('completedSubjects') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Завершено предметов</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.completedSubjects} / ${this.analytics.data.totalSubjects}</p></div>` : ''}
          ${this.selectedStats.includes('totalLessonsDone') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Всего уроков пройдено</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.totalLessonsDone}</p></div>` : ''}
          ${this.selectedStats.includes('streakDays') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Дней подряд (стрик)</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.streakDays} дн.</p></div>` : ''}
          ${this.selectedStats.includes('averageTime') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Среднее время сессии</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.averageTime}</p></div>` : ''}
          ${this.selectedStats.includes('totalPoints') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Всего очков</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.totalPoints}</p></div>` : ''}
          ${this.selectedStats.includes('avgPointsPerDay') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Очков в день (в среднем)</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.avgPointsPerDay}</p></div>` : ''}
          ${this.selectedStats.includes('mostActiveDay') ? `<div style="background:#f8f9fa; padding:0.8rem; border-radius:8px; border:1px solid #e9ecef;"><p style="margin:0; font-size:0.8rem; color:#6c757d;">Самый активный день</p><p style="margin:0.2rem 0 0; font-size:1.1rem; font-weight:600;">${this.analytics.data.mostActiveDay}</p></div>` : ''}
        </div>`;
        tempDiv.innerHTML += statsHtml;

        // Add subjects progress
        if (this.selectedStats.includes('subjects') && this.analytics.data.subjects && this.analytics.data.subjects.length > 0) {
          let subjectsHtml = '<ul style="list-style:none; padding:0;">';
          this.analytics.data.subjects.forEach(subject => {
            subjectsHtml += `<li style="margin-bottom:0.8rem; font-size:0.9rem; color:#495057;">
              <span style="display:block; margin-bottom:0.2rem;">${subject.name}</span>
              <div style="background:#e9ecef; border-radius:4px; height:6px; overflow:hidden;">
                <div style="width:${subject.progress}%; height:100%; background:#8b5cf6; border-radius:4px;"></div>
              </div>
              <span style="display:block; text-align:right; font-size:0.8rem; color:#6c757d; margin-top:0.2rem;">${subject.progress}%</span>
            </li>`;
          });
          subjectsHtml += '</ul>';
          addSection('Прогресс по предметам', subjectsHtml);
        }

        // Add recent activity
        if (this.selectedStats.includes('recentActivity') && this.analytics.data.recentActivity && this.analytics.data.recentActivity.length > 0) {
          let activityHtml = '<ul style="list-style:none; padding:0;">';
          this.analytics.data.recentActivity.forEach(activity => {
            // FIX: Include topic name in PDF recent activity
            const topicDisplay = activity.topic ? ` (${activity.topic})` : '';
            activityHtml += `<li style="margin-bottom:0.6rem; font-size:0.9rem; color:#495057;">
              <span style="font-weight:600;">${this.formatDate(activity.date)}:</span> ${activity.lesson}${topicDisplay} - ${activity.points} очков, ${this.formatDuration(activity.duration)}
            </li>`;
          });
          activityHtml += '</ul>';
          addSection('Последняя активность', activityHtml);
        }

        // Add chart (as image if possible, or skip if complex)
        if (this.selectedStats.includes('knowledgeChart') && this.knowledgeChartInstance) {
          const chartImage = this.knowledgeChartInstance.toBase64Image();
          addSection('График знаний', `<img src="${chartImage}" style="width:100%; height:auto; margin-top:1rem; border:1px solid #e9ecef; border-radius:8px;"/>`);
        }
        
        const pdfBlob = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
        
        const formData = new FormData();
        formData.append('userId', this.userId);
        formData.append('to', this.userEmail);
        formData.append('subject', 'Ваш отчет по аналитике обучения');
        formData.append('htmlContent', `
          <p>Здравствуйте!</p>
          <p>Ваш отчет по аналитике обучения запрашивался вами.</p>
          <p>Вы можете найти его во вложении.</p>
          <p>С уважением,<br>Ваша команда обучения</p>
        `);
        formData.append('pdfAttachment', pdfBlob, opt.filename);

        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/analytics/send-report`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' // Important for file uploads
          }
        });

        this.showSuccessMessage('Отчет успешно отправлен на вашу почту!');
      } catch (err) {
        console.error('❌ PDF email sending failed:', err);
        this.showErrorMessage('Ошибка отправки отчета на почту. Пожалуйста, попробуйте позже.');
      } finally {
        this.sendingEmail = false;
        this.showModal = false; // Close modal after action
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
          day: 'numeric'
        });
      } catch (e) {
        console.warn('Invalid date string:', dateString);
        return '—';
      }
    },

    formatDuration(minutes) {
      if (typeof minutes !== 'number' || minutes < 0) return '0 мин';
      if (minutes < 60) return `${minutes} мин`;
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) return `${hours} ч`;
      return `${hours} ч ${remainingMinutes} мин`;
    },

    showErrorMessage(message) {
      // Implement a custom modal or toast notification for error messages
      // For now, using a simple alert as a placeholder
      alert(message); 
    },

    showSuccessMessage(message) {
      // Implement a custom modal or toast notification for success messages
      // For now, using a simple alert as a placeholder
      alert(message);
    }
  },
  watch: {
    'analytics.data': {
      handler(newData) {
        if (newData) {
          this.$nextTick(() => {
            this.renderKnowledgeChart();
          });
        }
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
@import '@/assets/css/UserAnalyticsPanel.css';
</style>