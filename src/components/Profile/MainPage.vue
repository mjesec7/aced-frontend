<template>
  <div class="dashboard">
    <h1 class="title">👋 Добро пожаловать обратно!</h1>

    <!-- 🔍 Search and Filter -->
    <div class="controls">
      <input v-model="searchQuery" class="search-input" placeholder="🔍 Поиск тем или курсов..." />
      <select v-model="filterSubject" class="filter-select">
        <option value="">Все предметы</option>
        <option v-for="subject in allSubjects" :key="subject" :value="subject">{{ subject }}</option>
      </select>
    </div>

    <!-- 🎯 Smart Recommendations Block -->
    <div class="section">
      <div class="section-header">
        <h2>🎯 Рекомендовано для вас</h2>
        <button class="refresh-btn" @click="refreshRecommendations" :disabled="loadingRecommendations">
          🔄 Обновить
        </button>
      </div>

      <div v-if="loadingRecommendations" class="grid">
        <div class="recommendation-placeholder" v-for="n in 4" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredRecommendations.length" class="grid">
        <TopicCard
          v-for="topic in filteredRecommendations"
          :key="topic._id"
          :topic="topic"
          :lessons="topic.lessons"
          :description="topic.description"
          @add="handleAddTopic"
          @start="handleStartTopic"
        />
      </div>

      <div v-else class="empty-message">Нет подходящих рекомендаций.</div>
    </div>

    <!-- 📚 Study List Block -->
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
          :lessons="topic.lessons"
        />
      </div>

      <div v-else class="empty-message">У вас пока нет активных курсов.</div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import axios from 'axios';
import { auth } from '@/firebase';
import TopicCard from '@/components/Topics/TopicCard.vue';
import StudyCard from '@/components/Profile/StudyCard.vue';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'MainPage',
  components: { TopicCard, StudyCard },
  data() {
    return {
      userId: null,
      recommendations: [],
      studyList: [],
      allSubjects: [],
      loadingRecommendations: true,
      loadingStudyList: true,
      searchQuery: '',
      filterSubject: '',
    };
  },
  computed: {
    ...mapState(['firebaseUserId']),
    filteredRecommendations() {
      return this.recommendations.filter(t => {
        return (
          (!this.filterSubject || t.subject === this.filterSubject) &&
          (t.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    },
    filteredStudyList() {
      return this.studyList.filter(t => {
        return (
          (!this.filterSubject || t.subject === this.filterSubject) &&
          (t.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    },
  },
  async mounted() {
    const storedId =
      this.firebaseUserId ||
      localStorage.getItem('firebaseUserId') ||
      localStorage.getItem('userId');

    if (!storedId) return this.$router.push('/');

    this.userId = storedId;
    await Promise.all([this.fetchRecommendations(), this.fetchStudyList()]);
  },
  methods: {
    async fetchRecommendations() {
      try {
        this.loadingRecommendations = true;
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/recommendations`, { headers });

        this.recommendations = data || [];
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
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${BASE_URL}/users/${this.userId}/study-list`, { headers });

        this.studyList = data || [];
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
      const token = await auth.currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const url = `${BASE_URL}/users/${this.userId}/study-list`;

      const payload = {
        subject: topic.subject,
        level: topic.level,
        topic: topic.name,
      };

      await axios.post(url, payload, { headers });
      await this.fetchStudyList();
      this.recommendations = this.recommendations.filter(t => t._id !== topic._id);
    },
    handleStartTopic(topic) {
      if (!topic._id) return;
      this.$router.push({ path: `/topic/${topic._id}/overview` });
    },
  },
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
</style>
