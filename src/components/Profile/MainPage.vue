<template>
  <div class="dashboard">
    <h1 class="title">👋 Добро пожаловать обратно!</h1>
    <div class="controls">
      <input v-model="searchQuery" class="search-input" placeholder="🔍 Поиск тем или курсов..." />
      <select v-model="filterSubject" class="filter-select">
        <option value="">Все предметы</option>
        <option v-for="subject in allSubjects" :key="subject" :value="subject">{{ subject }}</option>
      </select>
      <span class="user-status-badge" :class="userStatus">{{ userStatusLabel }}</span>
    </div>

    <!-- 🌟 Recommendations -->
    <div class="section">
      <div class="section-header">
        <h2>🌟 Рекомендовано для вас</h2>
        <button class="refresh-btn" @click="refreshRecommendations" :disabled="loadingRecommendations">
          🔄 Обновить
        </button>
      </div>

      <div v-if="loadingRecommendations" class="grid">
        <div class="recommendation-placeholder" v-for="n in 4" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredRecommendations.length" class="grid">
        <div class="topic-card" v-for="topic in filteredRecommendations" :key="topic._id">
          <h3 class="topic-title">📘 {{ topic.name?.en || topic.name }}</h3>
          <p class="topic-desc">{{ topic.description?.en || topic.description || 'Описание отсутствует' }}</p>
          <p class="lesson-count">Уроков: {{ topic.lessons?.length || 0 }}</p>
          <div class="card-buttons">
            <button class="btn-add" @click="handleAddTopic(topic)">＋ Добавить</button>
            <button class="btn-start" @click="handleStartTopic(topic)">🚀 Начать</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-message">Нет подходящих рекомендаций.</div>
    </div>

    <!-- 📚 Study List -->
    <div class="section">
      <h2>📘 Мои курсы</h2>
      <div v-if="loadingStudyList" class="grid">
        <div class="study-placeholder" v-for="n in 3" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredStudyList.length" class="grid">
        <StudyCard
          v-for="topic in filteredStudyList"
          :key="topic._id"
          :topic="topic"
          :progress="topic.progress || { percent: 0, medal: 'none' }"
          :lessons="topic.lessons || []"
          @deleted="removeStudyCard"
        />
      </div>

      <div v-else class="empty-message">У вас пока нет активных курсов.</div>
    </div>

    <!-- 💳 Payment Modal -->
    <PaymentModal
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="userStatus = $event"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import axios from 'axios';
import { auth } from '@/firebase';
import StudyCard from '@/components/Profile/StudyCard.vue';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'MainPage',
  components: { StudyCard, PaymentModal },
  data() {
    return {
      userId: null,
      userStatus: 'free',
      recommendations: [],
      studyList: [],
      allSubjects: [],
      loadingRecommendations: true,
      loadingStudyList: true,
      searchQuery: '',
      filterSubject: '',
      showPaywall: false,
      requestedTopicId: null
    };
  },
  computed: {
    ...mapState(['firebaseUserId']),
    filteredRecommendations() {
      return this.recommendations
        .filter(t => t.lessons?.length)
        .filter(t => {
          const name = t.name?.en || t.name || '';
          const description = t.description?.en || t.description || '';
          return (
            (!this.filterSubject || t.subject === this.filterSubject) &&
            (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             description.toLowerCase().includes(this.searchQuery.toLowerCase()))
          );
        });
    },
    filteredStudyList() {
      return this.studyList.filter(t => {
        const name = t.name?.en || t.name || '';
        const description = t.description?.en || t.description || '';
        return (
          (!this.filterSubject || t.subject === this.filterSubject) &&
          (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
           description.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    },
    userStatusLabel() {
      if (this.userStatus === 'pro') return 'Pro';
      if (this.userStatus === 'start') return 'Start';
      return 'Free';
    }
  },
  async mounted() {
    const storedId = this.firebaseUserId || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) {
      return this.$router.push('/');
    }
    this.userId = storedId;
    await this.fetchUserStatus();
    await Promise.all([this.fetchRecommendations(), this.fetchStudyList()]);
  },
  methods: {
    async fetchUserStatus() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/status`, { headers });
        this.userStatus = data.status || 'free';
      } catch (err) {
        console.warn('⚠️ Не удалось загрузить статус пользователя. По умолчанию: free');
        this.userStatus = 'free';
      }
    },
    async fetchRecommendations() {
      try {
        this.loadingRecommendations = true;
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/recommendations`, { headers });
        this.recommendations = Array.isArray(data) ? data : [];
        this.extractSubjects(this.recommendations);
      } catch (err) {
        console.error('❌ Ошибка загрузки рекомендаций:', err);
      } finally {
        this.loadingRecommendations = false;
      }
    },
    async fetchStudyList() {
      try {
        this.loadingStudyList = true;
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/study-list`, { headers });
        const enriched = await Promise.all(
          data.map(async (item) => {
            try {
              const topicRes = await axios.get(`${BASE_URL}/topics/${item.topicId}`, { headers });
              const lessonsRes = await axios.get(`${BASE_URL}/lessons/topic/${item.topicId}`, { headers });
              if (!Array.isArray(lessonsRes.data) || lessonsRes.data.length === 0) {
                console.warn('❌ No lessons for topic, removing from list:', item.topicId);
                return null;
              }
              return {
                ...topicRes.data,
                lessons: lessonsRes.data,
                progress: item.progress || {}
              };
            } catch (e) {
              console.warn('❌ Failed to fetch topic:', item.topicId);
              return null;
            }
          })
        );
        this.studyList = enriched.filter(Boolean);
        this.extractSubjects(this.studyList);
      } catch (err) {
        console.error('❌ Ошибка загрузки курсов:', err);
      } finally {
        this.loadingStudyList = false;
      }
    },
    extractSubjects(items) {
      const subjects = new Set(items.map(item => item.subject).filter(Boolean));
      this.allSubjects = Array.from(subjects);
    },
    async refreshRecommendations() {
      await this.fetchRecommendations();
    },
    async handleAddTopic(topic) {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return alert('Пожалуйста, войдите в аккаунт.');
        const headers = { Authorization: `Bearer ${token}` };
        const url = `${BASE_URL}/users/${this.userId}/study-list`;
        const payload = {
          subject: topic.subject,
          level: topic.level,
          topic: topic.name?.en || topic.name || topic.topic,
          topicId: topic._id
        };
        await axios.post(url, payload, { headers });
        await this.fetchStudyList();
        this.recommendations = this.recommendations.filter(t => t._id !== topic._id);
      } catch (err) {
        console.error('❌ Ошибка добавления темы:', err);
      }
    },
    handleStartTopic(topic) {
      if (!topic._id) return;
      if (topic.type === 'premium' && (!this.userStatus || this.userStatus === 'free')) {
        this.requestedTopicId = topic._id;
        this.showPaywall = true;
      } else {
        this.$router.push({ path: `/topic/${topic._id}/overview` });
      }
    },
    removeStudyCard(id) {
      this.studyList = this.studyList.filter(topic => topic._id !== id);
    }
  }
};
</script>

<style scoped>
.dashboard {
  padding: 40px 20px;
  max-width: 1400px;
  margin: auto;
  font-family: 'Inter', sans-serif;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  color: #7c3aed;
  margin-bottom: 30px;
}

.controls {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
  justify-content: center;
  align-items: center;
}

.search-input,
.filter-select {
  padding: 12px 16px;
  font-size: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.user-status-badge {
  font-size: 0.9rem;
  padding: 8px 14px;
  border-radius: 20px;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
}
.user-status-badge.free {
  background: #6b7280;
}
.user-status-badge.start {
  background: #f59e0b;
}
.user-status-badge.pro {
  background: #10b981;
}

.section {
  margin-bottom: 60px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-btn {
  background: linear-gradient(to right, #8b5cf6, #60a5fa);
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}
.refresh-btn:hover {
  background: linear-gradient(to right, #7c3aed, #4f46e5);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  margin-top: 20px;
}

.recommendation-placeholder,
.study-placeholder {
  background: #f3f4f6;
  border-radius: 16px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #cbd5e1;
  font-weight: bold;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease-in-out;
}

.recommendation-placeholder:hover,
.study-placeholder:hover {
  transform: scale(1.02);
  background: linear-gradient(to right, #e0e7ff, #ede9fe);
  color: #7c3aed;
}

.empty-message {
  text-align: center;
  margin-top: 30px;
  font-size: 1.1rem;
  color: #9ca3af;
}

.topic-card {
  background: #ede9fe;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.topic-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #4f46e5;
}
.topic-desc {
  font-size: 0.95rem;
  color: #4b5563;
  margin: 10px 0;
}
.lesson-count {
  font-size: 0.85rem;
  color: #6b7280;
}
.card-buttons {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.btn-add {
  background: #60a5fa;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}
.btn-start {
  background: #f472b6;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}
.btn-add:hover {
  background: #3b82f6;
}
.btn-start:hover {
  background: #ec4899;
}
</style>
