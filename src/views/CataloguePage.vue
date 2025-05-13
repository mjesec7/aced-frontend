<template>
  <div class="lessons-page">
    <div class="page-header">
      <h1 class="page-title">📚 Каталог Уроков</h1>
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
      </select>
    </div>

    <div v-if="loading" class="loading">Загрузка уроков...</div>

    <div v-else-if="groupedTopics.length" class="lessons-grid">
      <div v-for="topic in groupedTopics" :key="topic.topicId" class="lesson-card">
        <div class="card-header">
          <h2 class="lesson-title">{{ topic.name }}</h2>
          <button class="add-btn" @click="addToStudyPlan(topic)">＋</button>
        </div>
        <p class="lesson-topic">
          Уровень: {{ topic.level }} / Предмет: {{ topic.subject }}
        </p>
        <p class="lesson-topic">
          📅 Уроков: {{ topic.lessonCount }} / Среднее время: {{ topic.totalTime }} мин.
        </p>
        <span class="access-label" :class="topic.type === 'premium' ? 'paid' : 'free'">
          {{ topic.type === 'premium' ? 'Платный' : 'Бесплатный' }}
        </span>
        <button class="start-btn" @click="handleAccess(topic.topicId, topic.type)">Начать курс</button>
      </div>
    </div>

    <div v-else class="no-lessons">❌ Уроки не найдены.</div>

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
import { mapState } from 'vuex';
import { auth } from '@/firebase';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { PaymentModal },
  data() {
    return {
      lessons: [],
      groupedTopics: [],
      loading: true,
      userId: null,
      filterType: 'all',
      searchQuery: '',
      showPaywall: false,
      requestedTopicId: null,
      plan: 'free',
      lang: localStorage.getItem('lang') || 'en'
    };
  },
  computed: {
    ...mapState(['firebaseUserId', 'user']),
    subscriptionClass() {
      return this.plan === 'pro' ? 'badge-pro' : this.plan === 'start' ? 'badge-start' : 'badge-free';
    },
    subscriptionText() {
      return this.plan === 'pro' ? 'Pro подписка' : this.plan === 'start' ? 'Start подписка' : 'Бесплатный доступ';
    }
  },
  async mounted() {
    const storedId = this.firebaseUserId || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) return (this.loading = false);
    this.userId = storedId;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.plan = res.data.status || 'free';
    } catch (err) {
      console.warn('⚠️ Не удалось получить статус подписки.');
    }

    this.loadLessons();
  },
  methods: {
    async loadLessons() {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons`);
        this.lessons = Array.isArray(data) ? data : [];

        const topicsMap = new Map();
        this.lessons.forEach(lesson => {
          const topicId = lesson.topicId;
          if (!topicsMap.has(topicId)) {
            topicsMap.set(topicId, {
              topicId,
              name: this.getTopicName(lesson),
              subject: lesson.subject,
              level: lesson.level,
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

        const filtered = [...topicsMap.values()].filter(topic => {
          const matchesFilter = this.filterType === 'all' || topic.type === this.filterType;
          const query = this.searchQuery.toLowerCase();
          const matchesSearch = topic.name.toLowerCase().includes(query) || topic.subject.toLowerCase().includes(query);
          return matchesFilter && matchesSearch;
        });

        this.groupedTopics = filtered;
      } catch (error) {
        console.error('❌ Ошибка при загрузке уроков:', error.response?.data || error.message);
      } finally {
        this.loading = false;
      }
    },
    getTopicName(lesson) {
      if (typeof lesson.topic === 'string') return lesson.topic;
      if (lesson.translations?.[this.lang]?.topic) return lesson.translations[this.lang].topic;
      if (lesson.topic?.[this.lang]) return lesson.topic[this.lang];
      return lesson.topic?.en || 'Без темы';
    },
    handleAccess(topicId, type) {
      if (type === 'premium' && (!this.plan || this.plan === 'free')) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
      } else {
        this.$router.push({ name: 'TopicOverview', params: { id: topicId } });
      }
    },
    async addToStudyPlan(topic) {
      if (!auth.currentUser) return alert('Пожалуйста, войдите в аккаунт.');

      try {
        const token = await auth.currentUser.getIdToken();
        const url = `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`;
        const body = { subject: topic.subject, topic: topic.name };
        await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
        alert(`✅ Тема "${topic.name}" добавлена!`);
      } catch (error) {
        console.error('❌ Ошибка при добавлении в учебный план:', error.response?.data || error.message);
        alert('❌ Не удалось добавить в учебный план');
      }
    }
  }
};
</script>



  
  
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

.page-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 30px;
}

.subscription-badge {
padding: 8px 16px;
font-weight: 700;
border-radius: 16px;
font-size: 0.85rem;
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.badge-free {
background-color: #f87171;
color: white;
}

.badge-start {
background-color: #facc15;
color: black;
}

.badge-pro {
background-color: #10b981;
color: white;
}

.lessons-page {
padding: 40px 20px;
max-width: 1300px;
margin: 0 auto;
font-family: 'Inter', sans-serif;
background: linear-gradient(to bottom, #f9fafb, #ffffff);
border-radius: 16px;
}

.page-title {
font-size: 3rem;
font-weight: 900;
color: #1f2937;
margin-bottom: 40px;
text-align: center;
text-shadow: 1px 1px 0 rgba(0,0,0,0.03);
}

.controls {
display: flex;
flex-wrap: wrap;
gap: 16px;
justify-content: center;
margin-bottom: 50px;
}

.search-input,
.filter-select {
padding: 14px 18px;
font-size: 1rem;
border: 1px solid #d1d5db;
border-radius: 14px;
min-width: 260px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
background: white;
transition: 0.3s;
}

.search-input:focus,
.filter-select:focus {
outline: none;
border-color: #7c3aed;
box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
}

.loading,
.no-lessons {
text-align: center;
font-size: 1.2rem;
color: #6b7280;
margin-top: 60px;
}

.lessons-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 36px;
}

.lesson-card {
background: white;
border: 1px solid #e5e7eb;
border-radius: 20px;
padding: 28px;
box-shadow: 0 8px 18px rgba(0, 0, 0, 0.04);
display: flex;
flex-direction: column;
transition: transform 0.3s ease, box-shadow 0.3s ease;
position: relative;
}

.lesson-card:hover {
transform: translateY(-6px);
box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
}

.card-header {
display: flex;
justify-content: space-between;
align-items: center;
}

.lesson-title {
font-size: 1.5rem;
font-weight: 800;
color: #1f2937;
}

.lesson-topic {
font-size: 1rem;
color: #6b7280;
margin-top: 12px;
}

.subject-badge {
font-size: 0.8rem;
padding: 6px 12px;
background: linear-gradient(to right, #6366f1, #ec4899);
color: white;
border-radius: 20px;
display: inline-block;
font-weight: 600;
margin-top: 10px;
}

.access-label {
margin-top: 8px;
font-size: 0.8rem;
font-weight: 700;
padding: 5px 12px;
border-radius: 14px;
display: inline-block;
align-self: flex-start;
}

.access-label.free {
background-color: #10b981;
color: white;
}

.access-label.paid {
background-color: #ef4444;
color: white;
}

.add-btn {
background: #10b981;
color: white;
font-size: 1.2rem;
border: none;
border-radius: 50%;
width: 36px;
height: 36px;
cursor: pointer;
transition: background 0.3s ease;
}

.add-btn:hover {
background: #059669;
}

.start-btn {
margin-top: 20px;
background: linear-gradient(to right, #60a5fa, #818cf8);
color: white;
padding: 12px 18px;
font-size: 0.95rem;
border: none;
border-radius: 14px;
cursor: pointer;
transition: background 0.3s ease;
}

.start-btn:hover {
background: linear-gradient(to right, #3b82f6, #6366f1);
}

.modal {
position: fixed;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
background-color: rgba(0, 0, 0, 0.5);
display: flex;
justify-content: center;
align-items: center;
z-index: 10000;
}

.modal-content {
background: white;
padding: 30px;
border-radius: 14px;
text-align: center;
max-width: 400px;
width: 90%;
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-content button {
margin-top: 15px;
padding: 10px 20px;
border: none;
border-radius: 10px;
font-weight: 600;
cursor: pointer;
}

.modal-content button:first-child {
background: linear-gradient(to right, #7c3aed, #8b5cf6);
color: white;
}

.modal-content button:last-child {
background: #e5e7eb;
color: #1f2937;
}
</style>
