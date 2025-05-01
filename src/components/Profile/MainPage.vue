<template>
  <div class="dashboard">
    <h1 class="title">Добро пожаловать!</h1>

    <!-- 🎯 Recommendations Block -->
    <div class="section">
      <div class="section-header">
        <h2>🎯 Рекомендуемые темы</h2>
        <button class="refresh-btn" @click="refreshRecommendations" :disabled="loadingRecommendations">
          🔄 Обновить
        </button>
      </div>

      <div v-if="loadingRecommendations" class="loading-spinner">Загрузка рекомендаций...</div>

      <div v-else-if="recommendations.length" class="grid">
        <TopicCard
          v-for="topic in recommendations"
          :key="topic._id"
          :topic="topic"
          @add="() => handleAddTopic(topic)"
          @start="() => handleStartTopic(topic)"
        />
      </div>

      <div v-else class="empty-message">Нет доступных рекомендаций.</div>
    </div>

    <!-- 📚 Study List Block -->
    <div class="section">
      <h2>📚 Мои темы</h2>

      <div v-if="loadingStudyList" class="loading-spinner">Загрузка ваших тем...</div>

      <div v-else-if="studyList.length" class="grid">
        <StudyCard
          v-for="topic in studyList"
          :key="topic._id"
          :topic="topic"
          :progress="topic.progress || { percent: 0, medal: 'none' }"
        />
      </div>

      <div v-else class="empty-message">У вас пока нет выбранных тем.</div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import axios from 'axios';
import { auth } from '@/firebase';
import TopicCard from '@/components/Topics/TopicCard.vue';
import StudyCard from '@/components/Profile/StudyCard.vue';

export default {
  name: 'MainPage',
  components: { TopicCard, StudyCard },
  data() {
    return {
      userId: null,
      recommendations: [],
      studyList: [],
      loadingRecommendations: true,
      loadingStudyList: true,
    };
  },
  computed: {
    ...mapState(['firebaseUserId']),
  },
  async mounted() {
    const storedId =
      this.firebaseUserId ||
      localStorage.getItem('firebaseUserId') ||
      localStorage.getItem('userId');

    if (!storedId) {
      console.warn('❌ Нет ID пользователя. Перенаправляем на главную страницу.');
      return this.$router.push('/');
    }

    this.userId = storedId;

    await Promise.all([this.fetchRecommendations(), this.fetchStudyList()]);
  },
  methods: {
    async fetchRecommendations() {
      try {
        this.loadingRecommendations = true;
        const token = await auth.currentUser.getIdToken();

        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/users/${this.userId}/recommendations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.recommendations = data || [];
        console.log(`✅ Загружено рекомендаций: ${this.recommendations.length}`);
      } catch (err) {
        console.error('❌ Ошибка загрузки рекомендаций:', err.response?.data || err.message);
      } finally {
        this.loadingRecommendations = false;
      }
    },

    async fetchStudyList() {
  try {
    this.loadingStudyList = true;

    if (!auth.currentUser) {
      console.warn('⚠️ [MainPage.vue] auth.currentUser is null');
      return;
    }

    const token = await auth.currentUser.getIdToken();
    console.log('🟣 [MainPage.vue] Firebase token:', token);

    const { data } = await axios.get(
      `${process.env.VUE_APP_API_URL}/users/${this.userId}/study-list`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [MainPage.vue] Study list data:', data);
    this.studyList = data || [];
  } catch (err) {
    console.error('❌ [MainPage.vue] fetchStudyList Error:', err.response?.data || err.message);
  } finally {
    this.loadingStudyList = false;
  }
},



    async refreshRecommendations() {
      await this.fetchRecommendations();
    },

    async handleAddTopic(topic) {
      try {
        const token = await auth.currentUser.getIdToken();

        await axios.post(
          `${process.env.VUE_APP_API_URL}/users/${this.userId}/study-list`,
          {
            subject: topic.subject,
            level: topic.level,
            topic: topic.name,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.studyList.push(topic);
        this.recommendations = this.recommendations.filter(
          (t) => t._id !== topic._id
        );

        alert('✅ Тема добавлена в ваш список изучения!');
      } catch (err) {
        console.error('❌ Ошибка добавления темы в план:', err.response?.data || err.message);
      }
    },

    handleStartTopic(topic) {
      this.$router.push(`/topic/${topic._id}/overview`);
    },
  },
};
</script>




<style scoped>
.dashboard {
  padding: 40px 20px;
  max-width: 1300px;
  margin: auto;
  font-family: 'Inter', sans-serif;
}

.title {
  font-size: 2.8rem;
  font-weight: 800;
  text-align: center;
  color: #7c3aed;
  margin-bottom: 50px;
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
  padding: 10px 18px;
  font-size: 0.9rem;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.loading-spinner {
  text-align: center;
  margin-top: 30px;
  font-size: 1.1rem;
  color: #6b7280;
}

.empty-message {
  text-align: center;
  margin-top: 30px;
  font-size: 1.1rem;
  color: #9ca3af;
}
</style>
