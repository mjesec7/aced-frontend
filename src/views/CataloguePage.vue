<template>
  <div class="lessons-page">
    <div class="page-header">
      <h1 class="page-title">Каталог Уроков</h1>
      <span class="subscription-badge" :class="subscriptionClass">
        {{ subscriptionText }}
      </span>
    </div>

    <div class="controls">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="🔍 Поиск уроков или тем..."
      />
      <select v-model="filterType" class="filter-select">
        <option value="all">Все</option>
        <option value="free">Бесплатные</option>
        <option value="premium">Премиум</option>
        <option value="in-progress">В процессе</option>
        <option value="completed">Завершенные</option>
      </select>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>Загрузка уроков...</span>
    </div>

    <div v-else-if="groupedTopics.length" class="lessons-grid">
      <div v-for="topic in groupedTopics" :key="topic.topicId" class="lesson-card">
        <div class="card-header">
          <h2 class="lesson-title">{{ topic.name }}</h2>
          <button class="add-btn" @click="addToStudyPlan(topic)" :disabled="topic.inStudyPlan">
            {{ topic.inStudyPlan ? '✓' : '＋' }}
          </button>
        </div>
        
        <p class="lesson-topic">
          <span class="topic-info">📚 {{ topic.subject }}</span>
          <span class="level-badge" :class="`level-${topic.level?.toLowerCase()}`">
            {{ topic.level }}
          </span>
        </p>
        
        <p class="lesson-stats">
          <span>📅 {{ topic.lessonCount }} уроков</span>
          <span>⏱️ {{ topic.totalTime }} мин</span>
        </p>

        <!-- Progress Section -->
        <div class="progress-section" v-if="topic.progress !== undefined">
          <div class="progress-header">
            <span class="progress-label">Прогресс</span>
            <span class="progress-percentage">{{ Math.round(topic.progress) }}%</span>
          </div>
          
          <!-- Modern Progress Bar -->
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: topic.progress + '%' }"
                :class="getProgressClass(topic.progress)"
              ></div>
            </div>
          </div>
          
          <!-- Mini Pie Chart for completed topics -->
          <div v-if="topic.progress > 0" class="mini-chart">
            <svg width="40" height="40" viewBox="0 0 40 40" class="pie-chart">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="4"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                :stroke="getProgressColor(topic.progress)"
                stroke-width="4"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="circumference - (topic.progress / 100) * circumference"
                transform="rotate(-90 20 20)"
                class="progress-circle"
              />
              <text x="20" y="20" text-anchor="middle" dy="0.3em" class="progress-text">
                {{ Math.round(topic.progress) }}%
              </text>
            </svg>
          </div>
        </div>

        <!-- Status Badges -->
        <div class="status-section">
          <span class="access-label" :class="topic.type === 'premium' ? 'paid' : 'free'">
            {{ topic.type === 'premium' ? '⭐ Премиум' : '🆓 Бесплатный' }}
          </span>
          
          <div class="status-badges">
            <span v-if="topic.progress === 100" class="status-badge completed">
              ✅ Завершен
            </span>
            <span v-else-if="topic.progress > 0" class="status-badge in-progress">
              🔄 В процессе
            </span>
            <span v-else class="status-badge not-started">
              ⭕ Не начат
            </span>
          </div>
        </div>

        <button 
          class="start-btn" 
          @click="handleAccess(topic.topicId, topic.type)"
          :class="getButtonClass(topic.progress)"
        >
          {{ getButtonText(topic.progress) }}
        </button>
      </div>
    </div>

    <div v-else class="no-lessons">
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Уроки не найдены</h3>
        <p>Попробуйте изменить параметры поиска или фильтра</p>
      </div>
    </div>

    <!-- Enhanced Modals -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showAddModal = false">×</button>
        <div class="modal-header">
          <h3>📚 Добавить в учебный план</h3>
        </div>
        <div class="modal-body">
          <div class="topic-preview">
            <h4>{{ selectedTopic?.name }}</h4>
            <p>{{ selectedTopic?.subject }} • {{ selectedTopic?.level }}</p>
            <div class="topic-stats">
              <span>📅 {{ selectedTopic?.lessonCount }} уроков</span>
              <span>⏱️ {{ selectedTopic?.totalTime }} минут</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddModal = false">Отмена</button>
          <button class="btn-primary" @click="confirmAddToStudyPlan">
            ✅ Добавить
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click="showSuccessModal = false">
      <div class="modal-content success-modal" @click.stop>
        <button class="modal-close" @click="showSuccessModal = false">×</button>
        <div class="success-content">
          <div class="success-icon">✅</div>
          <h3>Успешно добавлено!</h3>
          <p>Тема "{{ selectedTopic?.name }}" добавлена в ваш учебный план.</p>
          <button class="btn-primary" @click="showSuccessModal = false">
            Понятно
          </button>
        </div>
      </div>
    </div>

    <PaymentModal
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="plan = $event"
    />
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';
import { auth } from '@/firebase';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { PaymentModal },
  data() {
    return {
      lessons: [],
      groupedTopics: [],
      originalTopics: [],
      userProgress: {},
      studyPlanTopics: [],
      loading: true,
      userId: null,
      filterType: 'all',
      searchQuery: '',
      showPaywall: false,
      requestedTopicId: null,
      lang: localStorage.getItem('lang') || 'en',
      showAddModal: false,
      showSuccessModal: false,
      selectedTopic: null,
      circumference: 2 * Math.PI * 16 // for the pie chart
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser', 'userStatus']),
    subscriptionClass() {
      return this.userStatus === 'pro' ? 'badge-pro'
        : this.userStatus === 'start' ? 'badge-start'
        : 'badge-free';
    },
    subscriptionText() {
      return this.userStatus === 'pro' ? 'Pro подписка'
        : this.userStatus === 'start' ? 'Start подписка'
        : 'Бесплатный доступ';
    }
  },
  async mounted() {
    const storedId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) {
      this.loading = false;
      return;
    }
    this.userId = storedId;
    await Promise.all([
      this.loadLessons(),
      this.loadUserProgress(),
      this.loadStudyPlan()
    ]);
  },
  methods: {
    async loadLessons() {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons`);
        this.lessons = Array.isArray(data) ? data : [];
        this.processTopics();
      } catch (error) {
        console.error('❌ Ошибка при загрузке уроков:', error.response?.data || error.message);
      }
    },

    async loadUserProgress() {
      if (!this.userId) return;
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.userProgress = data || {};
      } catch (error) {
        console.error('❌ Ошибка при загрузке прогресса:', error.response?.data || error.message);
        this.userProgress = {};
      }
    },

    async loadStudyPlan() {
      if (!this.userId) return;
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.studyPlanTopics = (data || []).map(item => item.topicId?.toString());
      } catch (error) {
        console.error('❌ Ошибка при загрузке учебного плана:', error.response?.data || error.message);
        this.studyPlanTopics = [];
      }
    },

    processTopics() {
      const topicsMap = new Map();
      this.lessons.forEach(lesson => {
        const topicId = lesson.topicId?.toString();
        const name = this.getTopicName(lesson);
        if (!topicId || !name) return;

        if (!topicsMap.has(topicId)) {
          topicsMap.set(topicId, {
            topicId,
            name,
            subject: lesson.subject || '',
            level: lesson.level || '',
            type: lesson.type,
            lessonCount: 1,
            totalTime: 10
          });
        } else {
          const entry = topicsMap.get(topicId);
          entry.lessonCount += 1;
          entry.totalTime += 10;
        }
      });

      // Add progress and study plan info
      this.originalTopics = [...topicsMap.values()].map(topic => ({
        ...topic,
        progress: this.userProgress[topic.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(topic.topicId)
      }));

      this.applyFilters();
      this.loading = false;
    },

    applyFilters() {
      const query = this.searchQuery.toLowerCase();
      this.groupedTopics = this.originalTopics.filter(topic => {
        // Safe string conversion with fallback to empty string
        const topicName = (topic.name || '').toString().toLowerCase();
        const topicSubject = (topic.subject || '').toString().toLowerCase();
        
        const matchesSearch = topicName.includes(query) || topicSubject.includes(query);
        
        let matchesFilter = true;
        switch (this.filterType) {
          case 'free':
            matchesFilter = topic.type === 'free';
            break;
          case 'premium':
            matchesFilter = topic.type === 'premium';
            break;
          case 'in-progress':
            matchesFilter = topic.progress > 0 && topic.progress < 100;
            break;
          case 'completed':
            matchesFilter = topic.progress === 100;
            break;
          default:
            matchesFilter = true;
        }
        
        return matchesFilter && matchesSearch;
      });
    },

    getTopicName(lesson) {
      if (typeof lesson.topic === 'string') return lesson.topic;
      if (lesson.translations?.[this.lang]?.topic) return lesson.translations[this.lang].topic;
      if (lesson.topic?.[this.lang]) return lesson.topic[this.lang];
      if (lesson.topic?.en) return lesson.topic.en;
      return 'Без темы';
    },

    getProgressClass(progress) {
      if (progress === 100) return 'progress-completed';
      if (progress >= 70) return 'progress-high';
      if (progress >= 30) return 'progress-medium';
      return 'progress-low';
    },

    getProgressColor(progress) {
      if (progress === 100) return '#10b981';
      if (progress >= 70) return '#3b82f6';
      if (progress >= 30) return '#f59e0b';
      return '#ef4444';
    },

    getButtonClass(progress) {
      if (progress === 100) return 'btn-completed';
      if (progress > 0) return 'btn-continue';
      return 'btn-start';
    },

    getButtonText(progress) {
      if (progress === 100) return '✅ Завершен';
      if (progress > 0) return '▶️ Продолжить';
      return '🚀 Начать курс';
    },

    handleAccess(topicId, type) {
      if (type === 'premium' && !this.isPremiumUser) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
      } else {
        this.$router.push({ name: 'TopicOverview', params: { id: topicId } });
      }
    },

    addToStudyPlan(topic) {
      if (topic.inStudyPlan) return;
      this.selectedTopic = topic;
      this.showAddModal = true;
    },

    async confirmAddToStudyPlan() {
      if (!auth.currentUser) {
        alert('Пожалуйста, войдите в аккаунт.');
        return;
      }
      try {
        const token = await auth.currentUser.getIdToken();
        const url = `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`;
        const body = {
          subject: this.selectedTopic.subject,
          level: this.selectedTopic.level,
          topic: this.selectedTopic.name,
          topicId: this.selectedTopic.topicId
        };
        await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
        
        // Update local state
        this.selectedTopic.inStudyPlan = true;
        this.studyPlanTopics.push(this.selectedTopic.topicId);
        
        this.showAddModal = false;
        this.showSuccessModal = true;
      } catch (error) {
        console.error('❌ Ошибка при добавлении в план:', error.response?.data || error.message);
        alert('❌ Не удалось добавить тему');
        this.showAddModal = false;
      }
    }
  },
  watch: {
    searchQuery() {
      this.applyFilters();
    },
    filterType() {
      this.applyFilters();
    }
  }
};
</script>

<style scoped>
/* Enhanced Styles */
.lessons-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.subscription-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.badge-pro { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.badge-start { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.badge-free { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; }

.controls {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.search-input, .filter-select {
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  min-width: 300px;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px;
  font-size: 1.2rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.lesson-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.lesson-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lesson-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
}

.lesson-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.lesson-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.add-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-btn:disabled {
  background: #64748b;
  cursor: not-allowed;
}

.add-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.lesson-topic {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #64748b;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.level-beginner { background: #dcfce7; color: #166534; }
.level-intermediate { background: #fef3c7; color: #92400e; }
.level-advanced { background: #fee2e2; color: #991b1b; }

.lesson-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #64748b;
}

.progress-section {
  margin: 16px 0;
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-weight: 600;
  color: #374151;
}

.progress-percentage {
  font-weight: 700;
  color: #1f2937;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-low { background: linear-gradient(90deg, #ef4444, #f87171); }
.progress-medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.progress-high { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.progress-completed { background: linear-gradient(90deg, #10b981, #34d399); }

.mini-chart {
  margin-left: auto;
}

.pie-chart {
  width: 40px;
  height: 40px;
}

.progress-circle {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  font-size: 8px;
  font-weight: 600;
  fill: #374151;
}

.status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  flex-wrap: wrap;
  gap: 8px;
}

.access-label {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
}

.access-label.free {
  background: #dcfce7;
  color: #166534;
}

.access-label.paid {
  background: #fef3c7;
  color: #92400e;
}

.status-badges {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.in-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.not-started {
  background: #f1f5f9;
  color: #475569;
}

.start-btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-continue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.btn-completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.empty-state {
  text-align: center;
  padding: 64px 32px;
  color: #64748b;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

/* Enhanced Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slide-up 0.3s ease;
  position: relative;
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(107, 114, 128, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.topic-preview {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.topic-preview h4 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.topic-preview p {
  margin: 0 0 12px;
  color: #6b7280;
}

.topic-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 0.9rem;
  color: #64748b;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.success-modal {
  text-align: center;
}

.success-content {
  padding: 40px 24px;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.success-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 12px;
  color: #10b981;
}

.success-content p {
  color: #64748b;
  margin: 0 0 24px;
  line-height: 1.6;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .lessons-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .lessons-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .lesson-card {
    padding: 20px;
  }
  
  .progress-bar-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .mini-chart {
    margin: 8px auto 0;
  }
  
  .status-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .lesson-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .add-btn {
    align-self: flex-end;
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .lesson-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .progress-section {
    padding: 12px;
  }
  
  .pie-chart {
    width: 32px;
    height: 32px;
  }
  
  .progress-text {
    font-size: 6px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .lessons-page {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: #f1f5f9;
  }
  
  .lesson-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(100, 116, 139, 0.3);
  }
  
  .lesson-title {
    color: #f1f5f9;
  }
  
  .progress-section {
    background: rgba(15, 23, 42, 0.5);
  }
  
  .search-input,
  .filter-select {
    background: rgba(30, 41, 59, 0.9);
    color: #f1f5f9;
    border-color: rgba(100, 116, 139, 0.3);
  }
  
  .modal-content {
    background: #1e293b;
    color: #f1f5f9;
  }
  
  .modal-header {
    border-color: rgba(100, 116, 139, 0.3);
  }
  
  .topic-preview {
    background: rgba(15, 23, 42, 0.5);
  }
}

/* Print Styles */
@media print {
  .lessons-page {
    background: white;
    color: black;
  }
  
  .lesson-card {
    background: white;
    box-shadow: none;
    border: 1px solid #ccc;
    break-inside: avoid;
    margin-bottom: 20px;
  }
  
  .add-btn,
  .start-btn {
    display: none;
  }
  
  .progress-section {
    background: #f5f5f5;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .lesson-card {
    border: 2px solid #000;
    background: #fff;
  }
  
  .progress-bar {
    background: #000;
  }
  
  .progress-fill {
    background: #000 !important;
  }
  
  .btn-primary {
    background: #000;
    color: #fff;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .lesson-card:hover {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

</style>