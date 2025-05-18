<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading">Загрузка информации о курсе...</div>

    <div v-else-if="topic" class="topic-card">
      <h1 class="title">📘 {{ getTopicName(topic) }}</h1>
      <p class="description">{{ getTopicDescription(topic) }}</p>

      <div class="lesson-list">
        <h2>📚 Уроки</h2>
        <div class="lesson-grid">
          <div
            v-for="lesson in lessons"
            :key="lesson._id"
            class="lesson-card"
            :class="{ locked: lesson.type === 'premium' && userPlan === 'free' }"
          >
            <div class="card-top">
              <h3 class="lesson-name">{{ getLessonName(lesson) }}</h3>
              <span class="tag" :class="lesson.type === 'premium' ? 'premium' : 'free'">
                {{ lesson.type === 'premium' ? '🔒 Премиум' : 'Бесплатно' }}
              </span>
            </div>
            <button
              @click="startLesson(lesson)"
              :disabled="lesson.type === 'premium' && userPlan === 'free'"
            >
              {{ lesson.type === 'premium' ? 'Оформить подписку' : 'Начать' }}
            </button>
          </div>
        </div>
      </div>

      <div class="start-button-wrapper">
        <button class="start-course-btn" @click="startFirstLesson">🚀 Начать курс</button>
      </div>
    </div>

    <div v-else class="error">❌ Тема не найдена.</div>
  </div>
</template>

<script>
import axios from 'axios';
import { auth } from '@/firebase';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: null,
      lessons: [],
      loading: true,
      userPlan: 'free',
      lang: localStorage.getItem('lang') || 'en'
    };
  },
  async mounted() {
    const topicId = this.$route.params.id;
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const headers = { Authorization: `Bearer ${token}` };
        const statusRes = await axios.get(`${BASE_URL}/users/${auth.currentUser.uid}/status`, { headers });
        this.userPlan = statusRes.data?.status || 'free';
        console.log('📦 Подписка:', this.userPlan);
      }
    } catch (err) {
      console.warn('⚠️ Не удалось получить тариф. Используется: free');
      this.userPlan = 'free';
    }

    try {
      const topicRes = await axios.get(`${BASE_URL}/topics/${topicId}`);
      this.topic = topicRes.data;

      const lessonsRes = await axios.get(`${BASE_URL}/topics/${topicId}/lessons`);
      this.lessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      this.topic = null;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    getTopicName(topic) {
      return topic.name || 'Без названия';
    },
    getTopicDescription(topic) {
      return topic.description || 'Нет описания для этой темы.';
    },
    getLessonName(lesson) {
      return lesson.lessonName || 'Без названия';
    },
    startLesson(lesson) {
      if (lesson.type === 'premium' && this.userPlan === 'free') {
        alert('❌ Урок доступен только подписчикам.');
        return;
      }
      this.$router.push({ name: 'LessonPage', params: { id: lesson._id } });
    },
    startFirstLesson() {
      const first = this.lessons.find(
        l => l.type === 'free' || this.userPlan !== 'free'
      );
      if (first) {
        this.startLesson(first);
      } else {
        alert('❌ Нет доступных бесплатных уроков.');
      }
    }
  }
};
</script>

<style scoped>
.topic-overview {
  padding: 20px;
  font-family: 'Unbounded', sans-serif;
}
.title {
  font-size: 2rem;
  margin-bottom: 10px;
}
.description {
  margin-bottom: 20px;
  color: #555;
}
.lesson-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.lesson-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.lesson-card.locked {
  opacity: 0.6;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.lesson-name {
  font-weight: bold;
  font-size: 1rem;
}
.tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
.tag.premium {
  background: #fef2f2;
  color: #b91c1c;
}
.tag.free {
  background: #ecfdf5;
  color: #065f46;
}
.lesson-card button {
  margin-top: 10px;
  background: #4f46e5;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.lesson-card button:disabled {
  background-color: #bbb;
  cursor: not-allowed;
}
.start-button-wrapper {
  margin-top: 30px;
  text-align: center;
}
.start-course-btn {
  background-color: #10b981;
  padding: 10px 20px;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.3s ease;
}
.start-course-btn:hover {
  background-color: #059669;
}
.error {
  color: red;
  font-weight: bold;
}
</style>
