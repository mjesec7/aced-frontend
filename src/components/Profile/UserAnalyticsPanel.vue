<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">📈 {{ $t('analytics.title') }}</h1>
          <p class="page-subtitle">{{ $t('analytics.subtitle') }}</p>
        </div>
        <button @click="openModal" class="download-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ $t('analytics.downloadPdf') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('analytics.loading') }}</p>
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
        {{ $t('analytics.tryAgain') }}
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
            <h2 class="section-title">🧬 {{ $t('analytics.learningDna') }}</h2>
            <p class="section-subtitle">{{ $t('analytics.aiPersonalization') }}</p>
          </div>
        </div>

        <!-- Learning Style & Chronotype Grid -->
        <div class="dna-grid">
          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">{{ getLearningStyleIcon() }}</span>
              <h4>{{ $t('analytics.learningStyle') }}</h4>
            </div>
            <div class="dna-value">{{ getLearningStyleText() }}</div>
            <p class="dna-desc">{{ $t('analytics.primaryPerception') }}</p>
          </div>
          
          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">{{ getChronotypeIcon() }}</span>
              <h4>{{ $t('analytics.chronotype') }}</h4>
            </div>
            <div class="dna-value">{{ getChronotypeText() }}</div>
            <p class="dna-desc">{{ getOptimalTimesText() }}</p>
          </div>

          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">🎯</span>
              <h4>{{ $t('analytics.learningPath') }}</h4>
            </div>
            <div class="dna-value">{{ getPreferredPathText() }}</div>
            <p class="dna-desc">{{ $t('analytics.recommendedApproach') }}</p>
          </div>

          <div class="dna-card">
            <div class="dna-card-header">
              <span class="dna-icon">⏱️</span>
              <h4>{{ $t('analytics.sessionLength') }}</h4>
            </div>
            <div class="dna-value">{{ getSessionLengthText() }}</div>
            <p class="dna-desc">{{ $t('analytics.optimalSession') }}</p>
          </div>
        </div>

        <!-- Cognitive Profile -->
        <div v-if="learningProfile.cognitiveProfile" class="cognitive-profile-section">
          <h3 class="subsection-title">🧠 {{ $t('analytics.cognitiveProfile') }}</h3>
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
          <h3 class="subsection-title">💡 {{ $t('analytics.personalInsights') }}</h3>
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
            <h2 class="section-title">🎮 {{ $t('analytics.gamification') }}</h2>
            <p class="section-subtitle">{{ $t('analytics.level', { level: rewards.level }) }} • {{ $t('analytics.pointsCount', { count: formatNumber(rewards.totalPoints) }) }}</p>
          </div>
        </div>

        <!-- Level Progress -->
        <div class="level-section">
          <div class="level-info">
            <span class="level-label">{{ $t('analytics.level', { level: rewards.level }) }}</span>
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
            <span class="reward-stat-label">{{ $t('analytics.daysStreak') }}</span>
          </div>
          <div class="reward-stat">
            <span class="reward-stat-icon">🏆</span>
            <span class="reward-stat-value">{{ rewards.achievements?.length || 0 }}</span>
            <span class="reward-stat-label">{{ $t('analytics.achievementsCount') }}</span>
          </div>
          <div class="reward-stat">
            <span class="reward-stat-icon">🎯</span>
            <span class="reward-stat-value">{{ rewards.nextRewardIn || 0 }}</span>
            <span class="reward-stat-label">{{ $t('analytics.toNextReward') }}</span>
          </div>
        </div>

        <!-- Recent Achievements -->
        <div v-if="rewards.achievements?.length" class="achievements-showcase">
          <h3 class="subsection-title">🏅 {{ $t('analytics.recentAchievements') }}</h3>
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
            <h2 class="section-title">{{ $t('analytics.recentActivity') }}</h2>
            <p class="section-subtitle">{{ $t('analytics.recentActivityDesc') }}</p>
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
                <span class="activity-points">{{ $t('analytics.pointsCount', { count: formatNumber(activity.points) }) }}</span>
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
        <h3>{{ $t('analytics.noData') }}</h3>
        <p>{{ $t('analytics.startLearningDesc') }}</p>
        <button @click="$router.push('/catalogue')" class="action-button primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          {{ $t('analytics.startButton') }}
        </button>
      </div>
    </div>

    <!-- PDF Export Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ $t('analytics.pdfSettings') }}</h3>
          <button @click="showModal = false" class="close-button" :aria-label="$t('common.close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-section">
            <label for="period-select" class="modal-label">{{ $t('analytics.period') }}</label>
            <select id="period-select" v-model="period" class="modal-select">
              <option value="30">{{ $t('analytics.oneMonth') }}</option>
              <option value="90">{{ $t('analytics.threeMonths') }}</option>
              <option value="365">{{ $t('analytics.oneYear') }}</option>
            </select>
          </div>
          <div class="modal-section">
            <label class="modal-label">{{ $t('analytics.selectMetrics') }}</label>
            <div class="options-grid">
              <label v-for="stat in pdfStatOptions" :key="stat.key" class="option-checkbox">
                <input type="checkbox" v-model="selectedStats" :value="stat.key" />
                <span>{{ stat.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="action-button secondary">{{ $t('common.cancel') }}</button>
          <button @click="downloadPDF" class="action-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ $t('common.download') }}
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
    };
  },
  
  computed: {
    pdfStatOptions() {
      return [
          { key: 'studyDays', label: this.$t('analytics.studyDays') },
          { key: 'completedLessons', label: this.$t('analytics.completedLessons') },
          { key: 'completedTopics', label: this.$t('analytics.completedTopics') },
          { key: 'totalPoints', label: this.$t('analytics.totalPoints') },
          { key: 'streakDays', label: this.$t('analytics.streakDays') },
          { key: 'avgPointsPerDay', label: this.$t('analytics.avgPointsPerDay') },
      ];
    },
    hasAnyData() {
      const { totalLessonsDone, studyDays, subjects } = this.analytics;
      return totalLessonsDone > 0 || studyDays > 0 || subjects?.length > 0;
    },

    statCards() {
        const an = this.analytics;
        return [
            {
                id: 'points',
                label: this.$t('analytics.totalPoints'),
                value: this.formatNumber(an.totalPoints),
                subtext: this.$t('analytics.points'),
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
                color: 'purple'
            },
            {
                id: 'avgPoints',
                label: this.$t('analytics.avgPointsPerDay'),
                value: this.formatNumber(an.avgPointsPerDay),
                subtext: this.$t('analytics.points'),
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
                color: 'blue'
            },
            {
                id: 'studyDays',
                label: this.$t('analytics.studyDays'),
                value: this.formatNumber(an.studyDays),
                subtext: this.formatDaysToHuman(an.studyDays),
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                color: 'green'
            },
            {
                id: 'lessons',
                label: this.$t('analytics.completedLessons'),
                value: this.formatNumber(an.completedLessons || an.totalLessonsDone),
                subtext: this.$t('analytics.lesson'),
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                color: 'orange'
            },
            {
                id: 'topics',
                label: this.$t('analytics.completedTopics'),
                value: this.formatNumber(an.completedTopics),
                subtext: this.$t('analytics.topics'),
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
                color: 'teal'
            },
            {
                id: 'streak',
                label: this.$t('analytics.streak'),
                value: `${an.streakDays || 0}`,
                subtext: an.streakDays > 0 ? this.$t('analytics.daysStreak') : this.$t('analytics.startAgain'),
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
    getLocalizedLessonName(lesson) {
      if (!lesson) return '';
      const lang = localStorage.getItem('lang') || 'ru';
      if (lesson.title && typeof lesson.title === 'string') return lesson.title;
      if (lesson.name && typeof lesson.name === 'string') return lesson.name;
      if (lesson.lessonName) {
        if (typeof lesson.lessonName === 'string') return lesson.lessonName;
        if (typeof lesson.lessonName === 'object') {
          return lesson.lessonName[lang] || lesson.lessonName.en || lesson.lessonName.ru || lesson.lessonName.uz || '';
        }
      }
      return '';
    },

    // 🧬 NEW: Load all data including Learning DNA
    async loadAllData() {
      this.loading = true;
      this.error = null;
      
      try {
        const currentUser = auth.currentUser || (await new Promise(resolve => setTimeout(() => resolve(auth.currentUser), 1000)));

        if (!currentUser) {
          this.error = this.$t('analytics.authRequired');
          return;
        }
// Update streak first
        try {
          await updateStreak(currentUser.uid);
        } catch (streakError) {
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
}

        // Handle rewards
        if (rewardsRes.status === 'fulfilled' && rewardsRes.value?.success) {
          this.rewards = rewardsRes.value.rewards;
}

        // Handle recommendations
        if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value?.success) {
          this.recommendations = recommendationsRes.value.recommendation;
}

      } catch (err) {
const status = err.response?.status;
        if (status === 401) this.error = this.$t('analytics.authError');
        else if (status === 404) this.error = this.$t('analytics.notFound');
        else if (status >= 500) this.error = this.$t('analytics.serverError');
        else this.error = this.$t('analytics.loadError');
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
        visual: this.$t('analytics.visual'),
        auditory: this.$t('analytics.auditory'),
        kinesthetic: this.$t('analytics.kinesthetic'),
        'reading-writing': this.$t('analytics.readingWriting')
      };
      const key = this.learningProfile?.learningStyle?.primary?.toLowerCase();
      return styles[key] || this.$t('analytics.balanced');
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
        lark: this.$t('analytics.lark'),
        owl: this.$t('analytics.owl'),
        'third-bird': this.$t('analytics.thirdBird'),
        variable: this.$t('analytics.variable')
      };
      const key = this.learningProfile?.chronotype?.type?.toLowerCase();
      return types[key] || this.$t('analytics.flexible');
    },

    getOptimalTimesText() {
      const peakHours = this.learningProfile?.chronotype?.peakHours;
      if (!peakHours?.length) return this.$t('analytics.studyAnytime');
      const hours = peakHours.slice(0, 2).map(h => `${h}:00`).join(', ');
      return this.$t('analytics.betterAt', { hours });
    },

    getPreferredPathText() {
      const paths = {
        storyteller: this.$t('analytics.storyteller'),
        builder: this.$t('analytics.builder'),
        scientist: this.$t('analytics.scientist'),
        artist: this.$t('analytics.artist'),
        gamer: this.$t('analytics.gamer'),
        social: this.$t('analytics.social'),
        debater: this.$t('analytics.debater')
      };
      const key = this.learningProfile?.preferredPath?.toLowerCase();
      return paths[key] || this.$t('analytics.universal');
    },

    getSessionLengthText() {
      const length = this.recommendations?.sessionLength || this.learningProfile?.chronotype?.optimalSessionLength;
      return length ? this.$t('analytics.minutes', { count: length }) : this.$t('analytics.minutes', { count: 30 });
    },

    formatCognitiveLabel(key) {
      // Handle both camelCase and capitalized keys from API
      const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
      
      const labels = {
        processingSpeed: this.$t('analytics.processingSpeed'),
        workingMemory: this.$t('analytics.workingMemory'),
        visualSpatial: this.$t('analytics.visualSpatial'),
        verbalLinguistic: this.$t('analytics.verbalLinguistic'),
        logicalMathematical: this.$t('analytics.logicalMathematical'),
        // Direct mapping for capitalized keys if they exist in messages.json
        Processing: this.$t('analytics.Processing'),
        Memory: this.$t('analytics.Memory'),
        Visual: this.$t('analytics.Visual'),
        Verbal: this.$t('analytics.Verbal'),
        Logic: this.$t('analytics.Logic')
      };
      return labels[key] || labels[normalizedKey] || key;
    },

    async fetchLessonName(lessonId) {
      if (this.lessonCache.has(lessonId)) {
        return this.lessonCache.get(lessonId);
      }

      try {
        const response = await getLessonById(lessonId);
        const data = response?.data;
        const lessonName = this.getLocalizedLessonName(data) || this.$t('analytics.lessonWithoutName');

        this.lessonCache.set(lessonId, lessonName);
        return lessonName;
      } catch (error) {
const fallbackName = `${this.$t('analytics.lesson')} (${lessonId.slice(-6)})`;
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
            <h2 style="text-align:center; margin-bottom:20px;">📊 ${this.$t('analytics.title')}</h2>
            ${statContent}
            <div style="margin-top:20px; padding-top:20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <div style="margin-bottom: 8px;"><strong>${this.$t('analytics.period')}:</strong> ${this.period} ${this.$t('analytics.days')}</div>
                <div>${this.$t('analytics.generated')}: ${new Date().toLocaleString('ru-RU')}</div>
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
            alert(this.$t('analytics.loadError'));
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
      if (!lesson) return this.$t('analytics.lessonWithoutName');
      if (typeof lesson === 'string' && /^[a-f\d]{24}$/i.test(lesson)) {
        return `${this.$t('analytics.lesson')} (${lesson.slice(-6)})`;
      }
      return lesson;
    },

    formatDaysToHuman(days) {
      if (!days) return `0 ${this.$t('analytics.days')}`;
      const parts = [];
      if (days >= 365) parts.push(`${Math.floor(days / 365)} ${this.$t('analytics.yearShort')}`);
      if (days % 365 >= 30) parts.push(`${Math.floor((days % 365) / 30)} ${this.$t('analytics.monthShort')}`);
      if (days % 30 > 0 || parts.length === 0) parts.push(`${days % 30} ${this.$t('analytics.dayShort')}`);
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
          return `${this.$t('analytics.today')}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
          return `${this.$t('analytics.yesterday')}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
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

</style>