<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading">Загрузка информации о курсе...</div>

    <div v-else-if="topic" class="topic-card">
      <h1 class="title">📘 {{ getTopicName(topic) }}</h1>
      <p class="description">{{ getTopicDescription(topic) }}</p>

      <div class="lesson-list">
        <h2>📚 Уроки</h2>
        <ul>
          <li
            v-for="lesson in lessons"
            :key="lesson._id"
            class="lesson-item"
            :class="{ locked: lesson.type === 'premium' && userPlan === 'free' }"
          >
            <span>{{ getLessonName(lesson) }}</span>
            <button
              @click="startLesson(lesson)"
              :disabled="lesson.type === 'premium' && userPlan === 'free'"
            >
              {{ lesson.type === 'premium' ? '🔒 Премиум' : 'Начать' }}
            </button>
          </li>
        </ul>
      </div>

      <div class="start-button-wrapper">
        <button class="start-course-btn" @click="startFirstLesson">🚀 Поехали!</button>
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
        console.log('📦 User plan loaded:', this.userPlan);
      }
    } catch (err) {
      console.warn('⚠️ Не удалось получить статус пользователя. Установлено по умолчанию: free');
      this.userPlan = 'free';
    }

    try {
      const topicRes = await axios.get(`${BASE_URL}/topics/${topicId}`);
      this.topic = topicRes.data;

      const lessonsRes = await axios.get(`${BASE_URL}/topics/${topicId}/lessons`);
      this.lessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
    } catch (err) {
      console.error('❌ Ошибка загрузки темы или уроков:', err);
      this.topic = null;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    getTopicName(topic) {
      return topic.name?.[this.lang] || topic.name?.en || topic.name || 'Без названия';
    },
    getTopicDescription(topic) {
      return topic.description?.[this.lang] || topic.description?.en || topic.description || 'Нет описания для этой темы.';
    },
    getLessonName(lesson) {
      return lesson.lessonName?.[this.lang] || lesson.lessonName?.en || lesson.lessonName || 'Без названия';
    },
    startLesson(lesson) {
      if (lesson.type === 'premium' && this.userPlan === 'free') {
        alert('❌ Этот урок доступен только подписчикам.');
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
        alert('❌ Все уроки этой темы доступны только подписчикам.');
      }
    }
  }
};
</script>

<style scoped>
.topic-overview {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}
.loading,
.error {
  text-align: center;
  font-size: 1.2rem;
  color: #6b7280;
}
.title {
  font-size: 2.4rem;
  font-weight: 900;
  margin-bottom: 20px;
  color: #4c1d95;
}
.description {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 30px;
}
.lesson-list h2 {
  font-size: 1.4rem;
  margin-bottom: 12px;
  color: #4c1d95;
}
.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  margin-bottom: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.lesson-item.locked {
  opacity: 0.6;
  pointer-events: none;
}
.lesson-item button {
  padding: 6px 14px;
  background: linear-gradient(to right, #7c3aed, #6d28d9);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.lesson-item button:hover {
  background: linear-gradient(to right, #5b21b6, #6d28d9);
}
.start-button-wrapper {
  text-align: center;
  margin-top: 40px;
}
.start-course-btn {
  padding: 14px 28px;
  font-size: 1.1rem;
  background: linear-gradient(to right, #6d28d9, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
}
.start-course-btn:hover {
  background: linear-gradient(to right, #5b21b6, #6b21a8);
}
</style>
