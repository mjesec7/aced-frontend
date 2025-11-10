<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">📈 Аналитика обучения</h1>
          <p class="page-subtitle">Отслеживайте свой прогресс и достижения</p>
        </div>
        <button @click="openModal" class="download-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Скачать PDF
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загружаем аналитику...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h3>{{ error }}</h3>
      <button @click="loadAllData" class="action-button primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Попробовать снова
      </button>
    </div>

    <div v-else class="content-container">
      <!-- 🧬 NEW: Learning DNA Section -->
      <div v-if="learningProfile" class="section-card learning-dna-section">
        <div class="section-header">
          <div class="section-icon-badge dna">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
              <path d="M22 12A10 10 0 0 0 12 2v10z"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">🧬 Ваша ДНК обучения</h2>
            <p class="section-subtitle">AI-персонализация от сервера</p>
          </div>
        </div>

        <!-- Learning Style & Chronotype Grid -->
        <div class="dna-grid">
          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">{{ getLearningStyleIcon() }}</span>
              <h4>Стиль обучения</h4>
            </div>
            <div class="dna-value">{{ getLearningStyleText() }}</div>
            <p class="dna-desc">Основной способ восприятия</p>
          </div>
          
          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">{{ getChronotypeIcon() }}</span>
              <h4>Хронотип</h4>
            </div>
            <div class="dna-value">{{ getChronotypeText() }}</div>
            <p class="dna-desc">{{ getOptimalTimesText() }}</p>
          </div>

          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">🎯</span>
              <h4>Путь обучения</h4>
            </div>
            <div class="dna-value">{{ getPreferredPathText() }}</div>
            <p class="dna-desc">Рекомендованный подход</p>
          </div>

          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">⏱️</span>
              <h4>Длина сессии</h4>
            </div>
            <div class="dna-value">{{ getSessionLengthText() }}</div>
            <p class="dna-desc">Оптимальное время занятий</p>
          </div>
        </div>

        <!-- Cognitive Profile -->
        <div v-if="learningProfile.cognitiveProfile" class="cognitive-profile-section">
          <h3 class="subsection-title">🧠 Когнитивный профиль</h3>
          <div class="cognitive-bars">
            <div v-for="(value, key) in learningProfile.cognitiveProfile" :key="key" class="cognitive-bar">
              <span class="cognitive-label">{{ formatCognitiveLabel(key) }}</span>
              <div class="cognitive-progress">
                <div class="cognitive-fill" :style="{ width: value + '%' }"></div>
              </div>
              <span class="cognitive-value">{{ value }}%</span>
            </div>
          </div>
        </div>

        <!-- Insights -->
        <div v-if="learningProfile.insights?.length" class="insights-section">
          <h3 class="subsection-title">💡 Персональные инсайты</h3>
          <div class="insights-grid">
            <div v-for="(insight, index) in learningProfile.insights" :key="index" class="insight-card">
              {{ insight }}
            </div>
          </div>
        </div>
      </div>

      <!-- 🎮 NEW: Rewards Section -->
      <div v-if="rewards" class="section-card rewards-section">
        <div class="section-header">
          <div class="section-icon-badge rewards">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">🎮 Игрофикация</h2>
            <p class="section-subtitle">Уровень {{ rewards.level }} • {{ formatNumber(rewards.totalPoints) }} очков</p>
          </div>
        </div>

        <!-- Level Progress -->
        <div class="level-section">
          <div class="level-info">
            <span class="level-label">Уровень {{ rewards.level }}</span>
            <span class="level-percent">{{ Math.round(rewards.currentLevelProgress) }}%</span>
          </div>
          <div class="level-progress-bar">
            <div class="level-progress-fill" :style="{ width: rewards.currentLevelProgress + '%' }"></div>
          </div>
        </div>

        <!-- Rewards Stats -->
        <div class="rewards-stats">
          <div class="reward-stat">
            <span class="reward-stat-icon">🔥</span>
            <span class="reward-stat-value">{{ rewards.streak || 0 }}</span>
            <span class="reward-stat-label">Дней подряд</span>
          </div>
          <div class="reward-stat">
            <span class="reward-stat-icon">🏆</span>
            <span class="reward-stat-value">{{ rewards.achievements?.length || 0 }}</span>
            <span class="reward-stat-label">Достижений</span>
          </div>
          <div class="reward-stat">
            <span class="reward-stat-icon">🎯</span>
            <span class="reward-stat-value">{{ rewards.nextRewardIn || 0 }}</span>
            <span class="reward-stat-label">До награды</span>
          </div>
        </div>

        <!-- Recent Achievements -->
        <div v-if="rewards.achievements?.length" class="achievements-showcase">
          <h3 class="subsection-title">🏅 Последние достижения</h3>
          <div class="achievements-list">
            <div 
              v-for="achievement in rewards.achievements.slice(0, 6)" 
              :key="achievement.id"
              :class="['achievement-item', achievement.rarity]"
            >
              <span class="achievement-icon">{{ achievement.icon }}</span>
              <div class="achievement-info">
                <span class="achievement-name">{{ achievement.name }}</span>
                <span class="achievement-date">{{ formatDate(achievement.unlockedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Original Stats Grid -->
      <div class="stats-grid">
        <div v-for="stat in statCards" :key="stat.id" class="stat-card">
          <div :class="`stat-icon ${stat.color}`" v-html="stat.icon"></div>
          <div class="stat-content">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-subtext">{{ stat.subtext }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div v-if="analytics.recentActivity?.length > 0" class="section-card">
        <div class="section-header">
          <div class="section-icon-badge">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div>
            <h2 class="section-title">Последняя активность</h2>
            <p class="section-subtitle">Ваши недавние достижения</p>
          </div>
        </div>
        <div class="activity-list">
          <div v-for="(activity, index) in analytics.recentActivity.slice(0, 5)" :key="`activity-${index}-${activity.date}`" class="activity-item">
            <div class="activity-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ formatLessonName(activity.lesson) }}</div>
              <div class="activity-meta">
                <span>{{ formatDate(activity.date) }}</span>
                <span class="activity-points">{{ formatNumber(activity.points) }} очков</span>
                <span v-if="activity.duration">{{ formatDuration(activity.duration) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!hasAnyData" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <h3>Пока нет данных для аналитики</h3>
        <p>Начните изучать уроки, чтобы увидеть свой прогресс</p>
        <button @click="$router.push('/catalogue')" class="action-button primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Начать обучение
        </button>
      </div>
    </div>

    <!-- PDF Export Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Настройки экспорта PDF</h3>
          <button @click="showModal = false" class="close-button" aria-label="Закрыть модальное окно">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-section">
            <label for="period-select" class="modal-label">Период</label>
            <select id="period-select" v-model="period" class="modal-select">
              <option value="30">1 месяц</option>
              <option value="90">3 месяца</option>
              <option value="365">1 год</option>
            </select>
          </div>
          <div class="modal-section">
            <label class="modal-label">Выберите метрики</label>
            <div class="options-grid">
              <label v-for="stat in pdfStatOptions" :key="stat.key" class="option-checkbox">
                <input type="checkbox" v-model="selectedStats" :value="stat.key" />
                <span>{{ stat.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="action-button secondary">Отмена</button>
          <button @click="downloadPDF" class="action-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Скачать
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { 
  getUserAnalytics, 
  getLessonById,
  // 🧬 NEW: Learning DNA & Gamification
  getLearningProfile,
  getPersonalizedRecommendations,
  getUserRewards,
  updateStreak
} from '@/api';

export default {
  name: 'UserAnalyticsPanel',
  data() {
    return {
      loading: true,
      error: null,
      showModal: false,
      selectedStats: ['studyDays', 'completedLessons', 'totalPoints', 'streakDays'],
      period: 30,
      lessonCache: new Map(),
      
      // 🧬 NEW: Learning DNA & Gamification
      learningProfile: null,
      recommendations: null,
      rewards: null,
      
      analytics: {
        studyDays: 0,
        completedLessons: 0,
        completedTopics: 0,
        totalLessonsDone: 0,
        streakDays: 0,
        totalPoints: 0,
        avgPointsPerDay: 0,
        subjects: [],
        topics: [],
        recentActivity: [],
      },
      pdfStatOptions: [
          { key: 'studyDays', label: 'Дней в обучении' },
          { key: 'completedLessons', label: 'Завершено уроков' },
          { key: 'completedTopics', label: 'Завершено тем' },
          { key: 'totalPoints', label: 'Общие очки' },
          { key: 'streakDays', label: 'Учебный стрик' },
          { key: 'avgPointsPerDay', label: 'Очков в день' },
      ],
    };
  },
  
  computed: {
    hasAnyData() {
      const { totalLessonsDone, studyDays, subjects } = this.analytics;
      return totalLessonsDone > 0 || studyDays > 0 || subjects?.length > 0;
    },

    statCards() {
        const an = this.analytics;
        return [
            {
                id: 'points',
                label: 'Общие очки',
                value: this.formatNumber(an.totalPoints),
                subtext: 'Баллы за активность',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
                color: 'purple'
            },
            {
                id: 'avgPoints',
                label: 'Очков в день',
                value: this.formatNumber(an.avgPointsPerDay),
                subtext: 'Средний заработок',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
                color: 'blue'
            },
            {
                id: 'studyDays',
                label: 'Дней в обучении',
                value: this.formatNumber(an.studyDays),
                subtext: this.formatDaysToHuman(an.studyDays),
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                color: 'green'
            },
            {
                id: 'lessons',
                label: 'Завершено уроков',
                value: this.formatNumber(an.completedLessons || an.totalLessonsDone),
                subtext: 'Пройденные уроки',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                color: 'orange'
            },
            {
                id: 'topics',
                label: 'Завершено тем',
                value: this.formatNumber(an.completedTopics),
                subtext: 'Изученные разделы',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
                color: 'teal'
            },
            {
                id: 'streak',
                label: 'Стрик',
                value: `${an.streakDays || 0}`,
                subtext: an.streakDays > 0 ? 'дней подряд' : 'Начни снова',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
                color: 'pink'
            }
        ];
    }
  },

  async mounted() {
    await this.loadAllData();
  },

  methods: {
    // 🧬 NEW: Load all data including Learning DNA
    async loadAllData() {
      this.loading = true;
      this.error = null;
      
      try {
        const currentUser = auth.currentUser || (await new Promise(resolve => setTimeout(() => resolve(auth.currentUser), 1000)));

        if (!currentUser) {
          this.error = 'Необходима авторизация';
          return;
        }

        console.log('🚀 Loading analytics and Learning DNA...');

        // Update streak first
        try {
          await updateStreak(currentUser.uid);
        } catch (streakError) {
          console.warn('⚠️ Streak update failed:', streakError);
        }

        // Load all data in parallel
        const [analyticsRes, profileRes, rewardsRes, recommendationsRes] = await Promise.allSettled([
          getUserAnalytics(currentUser.uid),
          getLearningProfile(currentUser.uid),
          getUserRewards(currentUser.uid),
          getPersonalizedRecommendations(currentUser.uid)
        ]);

        // Handle analytics
        if (analyticsRes.status === 'fulfilled') {
          const responseData = analyticsRes.value?.data?.data || analyticsRes.value?.data;
          if (responseData && typeof responseData === 'object') {
            this.analytics = { ...this.analytics, ...responseData };
            await this.resolveActivityLessonNames();
          }
        }

        // Handle learning profile
        if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
          this.learningProfile = profileRes.value.profile;
          console.log('✅ Learning profile loaded');
        }

        // Handle rewards
        if (rewardsRes.status === 'fulfilled' && rewardsRes.value?.success) {
          this.rewards = rewardsRes.value.rewards;
          console.log('✅ Rewards loaded');
        }

        // Handle recommendations
        if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value?.success) {
          this.recommendations = recommendationsRes.value.recommendation;
          console.log('✅ Recommendations loaded');
        }

      } catch (err) {
        console.error('❌ Error loading data:', err);
        const status = err.response?.status;
        if (status === 401) this.error = 'Ошибка авторизации';
        else if (status === 404) this.error = 'Данные не найдены. Начните изучать уроки!';
        else if (status >= 500) this.error = 'Ошибка на сервере';
        else this.error = 'Ошибка загрузки данных';
      } finally {
        this.loading = false;
      }
    },

    async loadAnalytics() {
      await this.loadAllData();
    },

    // 🧬 NEW: Learning DNA helper methods
    getLearningStyleIcon() {
      const icons = {
        visual: '👁️',
        auditory: '👂',
        kinesthetic: '🤸',
        'reading-writing': '📝'
      };
      return icons[this.learningProfile?.learningStyle?.primary] || '🎯';
    },

    getLearningStyleText() {
      const styles = {
        visual: 'Визуальный',
        auditory: 'Аудиальный',
        kinesthetic: 'Кинестетический',
        'reading-writing': 'Чтение/письмо'
      };
      return styles[this.learningProfile?.learningStyle?.primary] || 'Сбалансированный';
    },

    getChronotypeIcon() {
      const icons = {
        lark: '🌅',
        owl: '🦉',
        'third-bird': '🐦',
        variable: '🔄'
      };
      return icons[this.learningProfile?.chronotype?.type] || '🐦';
    },

    getChronotypeText() {
      const types = {
        lark: 'Жаворонок',
        owl: 'Сова',
        'third-bird': 'Голубь',
        variable: 'Гибкий'
      };
      return types[this.learningProfile?.chronotype?.type] || 'Гибкий';
    },

    getOptimalTimesText() {
      const peakHours = this.learningProfile?.chronotype?.peakHours;
      if (!peakHours?.length) return 'Учитесь в любое время';
      const hours = peakHours.slice(0, 2).map(h => `${h}:00`).join(', ');
      return `Лучше в ${hours}`;
    },

    getPreferredPathText() {
      const paths = {
        storyteller: 'Рассказчик',
        builder: 'Строитель',
        scientist: 'Ученый',
        artist: 'Художник',
        gamer: 'Игрок',
        social: 'Социальный',
        debater: 'Дебатер'
      };
      return paths[this.learningProfile?.preferredPath] || 'Универсальный';
    },

    getSessionLengthText() {
      const length = this.recommendations?.sessionLength || this.learningProfile?.chronotype?.optimalSessionLength;
      return length ? `${length} минут` : '30 минут';
    },

    formatCognitiveLabel(key) {
      const labels = {
        processingSpeed: 'Скорость обработки',
        workingMemory: 'Рабочая память',
        visualSpatial: 'Визуально-пространственное',
        verbalLinguistic: 'Вербально-лингвистическое',
        logicalMathematical: 'Логико-математическое'
      };
      return labels[key] || key;
    },

    async fetchLessonName(lessonId) {
      if (this.lessonCache.has(lessonId)) {
        return this.lessonCache.get(lessonId);
      }

      try {
        const response = await getLessonById(lessonId);
        const data = response?.data;
        const lessonName = data?.lessonName || data?.title || data?.name || 'Урок без названия';
        
        this.lessonCache.set(lessonId, lessonName);
        return lessonName;
      } catch (error) {
        console.error(`❌ Error fetching name for lesson ${lessonId}:`, error);
        const fallbackName = `Урок (${lessonId.slice(-6)})`;
        this.lessonCache.set(lessonId, fallbackName);
        return fallbackName;
      }
    },

    async resolveActivityLessonNames() {
      const activitiesToResolve = this.analytics.recentActivity?.filter(
        activity => typeof activity.lesson === 'string' && /^[a-f\d]{24}$/i.test(activity.lesson)
      ) || [];

      if (activitiesToResolve.length === 0) return;
      
      const lessonIds = [...new Set(activitiesToResolve.map(a => a.lesson))];
      const promises = lessonIds.map(id => this.fetchLessonName(id));

      try {
        await Promise.allSettled(promises);
        
        this.analytics.recentActivity.forEach(activity => {
            if (this.lessonCache.has(activity.lesson)) {
                activity.lesson = this.lessonCache.get(activity.lesson);
            }
        });
      } catch (error) {
        console.error('❌ Error during lesson name resolution:', error);
      }
    },

    openModal() {
      this.showModal = true;
    },

    async downloadPDF() {
        const { default: html2pdf } = await import('html2pdf.js');

        const statContent = this.pdfStatOptions
            .filter(opt => this.selectedStats.includes(opt.key))
            .map(opt => {
                const value = this.analytics[opt.key] ?? '—';
                return `
                    <div style="margin: 12px 0; padding: 8px; border-left: 3px solid #a855f7; background: #f8f9fa;">
                        <strong>${opt.label}:</strong> ${this.formatNumber(value)}
                    </div>`;
            })
            .join('');

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'padding: 20px; font-family: Arial, sans-serif;';
        wrapper.innerHTML = `
            <h2 style="text-align:center; margin-bottom:20px;">📊 Аналитика обучения</h2>
            ${statContent}
            <div style="margin-top:20px; padding-top:20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <div style="margin-bottom: 8px;"><strong>Период:</strong> ${this.period} дней</div>
                <div>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</div>
            </div>`;

        this.showModal = false;

        try {
            await html2pdf().set({
                margin: 0.5,
                filename: `analytics-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }).from(wrapper).save();
        } catch (err) {
            alert('Ошибка при генерации PDF');
        }
    },

    formatNumber: (value) => {
        const num = Number(value);
        return (value === null || value === undefined || isNaN(num)) ? '—' : num.toLocaleString('ru-RU');
    },

    formatDuration: (duration) => {
        const minutes = Number(duration);
        return isNaN(minutes) ? duration : `${Math.round(minutes)} мин`;
    },

    formatLessonName: (lesson) => {
      if (!lesson) return 'Урок без названия';
      if (typeof lesson === 'string' && /^[a-f\d]{24}$/i.test(lesson)) {
        return `Урок (${lesson.slice(-6)})`;
      }
      return lesson;
    },

    formatDaysToHuman(days) {
      if (!days) return '0 дней';
      const parts = [];
      if (days >= 365) parts.push(`${Math.floor(days / 365)} г.`);
      if (days % 365 >= 30) parts.push(`${Math.floor((days % 365) / 30)} мес.`);
      if (days % 30 > 0 || parts.length === 0) parts.push(`${days % 30} дн.`);
      return `≈ ${parts.join(' ')}`;
    },

    formatDate(dateString) {
      if (!dateString) return '—';
      try {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
          return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
          return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (err) {
        return '—';
      }
    }
  }
};
</script>

<style scoped>
/* =============================================
   GENERAL STYLES
   ============================================= */
.analytics-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 1.5rem;
}

/* =============================================
   HEADER
   ============================================= */
.page-header {
  max-width: 1400px;
  margin: 0 auto 2rem;
}

.header-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.download-button {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.download-button:hover {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.download-button svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* =============================================
   LOADING & ERROR STATES
   ============================================= */
.loading-state,
.error-state {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  margin: 0;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  color: #ef4444;
  margin: 0 auto 1rem;
}

.error-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
}

/* =============================================
   CONTENT CONTAINER
   ============================================= */
.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* =============================================
   🧬 LEARNING DNA SECTION (NEW)
   ============================================= */
.learning-dna-section {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 1px solid #e9d5ff;
}

.section-icon-badge.dna {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.dna-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.dna-card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid #e9d5ff;
  transition: all 0.2s;
}

.dna-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
}

.dna-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.dna-card-header h4 {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
  font-weight: 600;
}

.dna-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.dna-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.dna-desc {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.cognitive-profile-section {
  margin-bottom: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9d5ff;
}

.cognitive-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cognitive-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e9d5ff;
}

.cognitive-label {
  flex: 0 0 180px;
  font-size: 0.8125rem;
  color: #4b5563;
  font-weight: 500;
}

.cognitive-progress {
  flex: 1;
  height: 8px;
  background: rgba(168, 85, 247, 0.15);
  border-radius: 9999px;
  overflow: hidden;
}

.cognitive-fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #9333ea);
  transition: width 0.5s ease;
  border-radius: 9999px;
}

.cognitive-value {
  flex: 0 0 50px;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 700;
  color: #a855f7;
}

.insights-section {
  padding-top: 2rem;
  border-top: 1px solid #e9d5ff;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.insight-card {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #a855f7;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
}

/* =============================================
   🎮 REWARDS SECTION (NEW)
   ============================================= */
.rewards-section {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fcd34d;
}

.section-icon-badge.rewards {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.level-section {
  margin-bottom: 2rem;
}

.level-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.level-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #78350f;
}

.level-percent {
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.level-progress-bar {
  height: 12px;
  background: rgba(217, 119, 6, 0.2);
  border-radius: 9999px;
  overflow: hidden;
}

.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #d97706);
  transition: width 0.5s ease;
  border-radius: 9999px;
}

.rewards-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.reward-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: 10px;
  border: 1px solid #fcd34d;
}

.reward-stat-icon {
  font-size: 2rem;
}

.reward-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.reward-stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  text-align: center;
}

.achievements-showcase {
  padding-top: 2rem;
  border-top: 1px solid #fcd34d;
}

.achievements-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.achievement-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.achievement-item.legendary {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.achievement-item.epic {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.achievement-item.rare {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.achievement-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.achievement-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.achievement-date {
  font-size: 0.75rem;
  color: #6b7280;
}

/* =============================================
   STATS GRID
   ============================================= */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: #d1d5db;
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon :deep(svg) {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}

.stat-icon.purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
.stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.stat-icon.pink { background: linear-gradient(135deg, #ec4899, #db2777); }

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-subtext {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* =============================================
   SECTION CARD
   ============================================= */
.section-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-icon-badge {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  flex-shrink: 0;
}

.section-icon-badge svg {
  width: 1.125rem;
  height: 1.125rem;
  color: white;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.section-subtitle {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

/* =============================================
   ACTIVITY LIST
   ============================================= */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.activity-item:hover {
  background: #f3f4f6;
}
.activity-icon {
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.activity-icon svg {
  width: 1.125rem;
  height: 1.125rem;
  color: white;
}
.activity-content {
  flex: 1;
  min-width: 0;
}
.activity-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.25rem;
}
.activity-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #6b7280;
  flex-wrap: wrap;
}
.activity-points {
  color: #a855f7;
  font-weight: 500;
}

/* =============================================
   EMPTY STATE
   ============================================= */
.empty-state {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

/* =============================================
   ACTION BUTTON
   ============================================= */
.action-button {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-button svg {
  width: 1rem;
  height: 1rem;
}

.action-button.primary {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.action-button.primary:hover {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.action-button.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.action-button.secondary:hover {
  background: #e5e7eb;
}

/* =============================================
   MODAL
   ============================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}
.close-button {
  background: none;
  border: none;
  border-radius: 6px;
  padding: 0.25rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.close-button:hover {
  background: #f3f4f6;
  color: #111827;
}
.close-button svg {
  width: 1.5rem;
  height: 1.5rem;
}
.modal-body {
  padding: 1.5rem;
}
.modal-section:not(:last-child) {
  margin-bottom: 1.5rem;
}
.modal-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
.modal-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}
.modal-select:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}
.option-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.option-checkbox:hover {
  background: #f3f4f6;
}
.option-checkbox input[type="checkbox"] {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: #a855f7;
}
.option-checkbox span {
  font-size: 0.875rem;
  color: #374151;
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* =============================================
   RESPONSIVE & DARK MODE
   ============================================= */
@media (max-width: 768px) {
  .analytics-page { padding: 1rem; }
  .header-content { flex-direction: column; align-items: stretch; }
  .download-button { justify-content: center; }
  .stats-grid, .options-grid { grid-template-columns: 1fr; }
  .dna-grid { grid-template-columns: 1fr; }
  .rewards-stats { grid-template-columns: 1fr; }
  .achievements-list { grid-template-columns: 1fr; }
  .cognitive-label { flex: 0 0 120px; font-size: 0.75rem; }
}

@media (prefers-color-scheme: dark) {
  .analytics-page { background: #111827; }
  .header-content, .loading-state, .error-state, .stat-card, .section-card, .empty-state, .modal-card { background: #1f2937; border-color: #374151; }
  .page-title, .stat-value, .section-title, .activity-title, .empty-state h3, .modal-header h3 { color: #f9fafb; }
  .page-subtitle, .stat-label, .stat-subtext, .section-subtitle, .activity-meta, .empty-state p, .modal-label, .option-checkbox span { color: #9ca3af; }
  .activity-item { background: #374151; }
  .activity-item:hover { background: #4b5563; }
  .action-button.secondary, .close-button { background: #374151; color: #d1d5db; border-color: #4b5563; }
  .action-button.secondary:hover, .close-button:hover { background: #4b5563; }
  .modal-header, .modal-footer { border-color: #374151; }
  .modal-select { background: #374151; border-color: #4b5563; color: #f9fafb; }
  .option-checkbox { background: #374151; border-color: #4b5563; }
  .option-checkbox:hover { background: #4b5563; }
  .learning-dna-section { background: linear-gradient(135deg, #1f1533 0%, #2d1b4e 100%); border-color: #4c1d95; }
  .dna-card, .cognitive-bar, .insight-card { background: #1f2937; border-color: #4c1d95; }
  .rewards-section { background: linear-gradient(135deg, #422006 0%, #78350f 100%); border-color: #d97706; }
  .reward-stat, .achievement-item { background: #1f2937; border-color: #d97706; }
}
</style>