<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading">Загрузка информации о курсе...</div>

    <div v-else-if="topic" class="topic-card">
      <h1 class="title">📘 {{ topic.name?.en || topic.name || 'Без названия' }}</h1>
      <p class="description">{{ topic.description?.en || topic.description || 'Нет описания для этой темы.' }}</p>

      <div class="lesson-list">
        <h2>📚 Уроки</h2>
        <ul>
          <li
            v-for="lesson in lessons"
            :key="lesson._id"
            class="lesson-item"
            :class="{ locked: lesson.type === 'premium' && !isPremiumUser }"
          >
            <span>{{ lesson.lessonName?.en || lesson.lessonName }}</span>
            <button
              @click="startLesson(lesson)"
              :disabled="lesson.type === 'premium' && !isPremiumUser"
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
import { mapGetters } from 'vuex';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: null,
      lessons: [],
      loading: true
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser', 'userStatus'])
  },
  // ✅ REPLACE the mounted() method in TopicOverview.vue

async mounted() {
  const topicId = this.$route.params.id;
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    console.log('🔍 Loading topic:', topicId);

    // ✅ FIX: Load topic by ID - handle the response structure correctly
    const topicRes = await axios.get(`${BASE_URL}/topics/${topicId}`, { headers });
    
    // ✅ Handle both possible response structures
    if (topicRes.data.success) {
      this.topic = topicRes.data.data; // New structure with success flag
    } else {
      this.topic = topicRes.data; // Legacy structure
    }

    console.log('✅ Topic loaded:', this.topic?.name?.en || this.topic?.name);

    // ✅ FIX: Load lessons for the topic - handle response structure correctly
    try {
      const lessonsRes = await axios.get(`${BASE_URL}/topics/${topicId}/lessons`, { headers });
      
      // ✅ Handle the response structure from your topicRoutes
      if (lessonsRes.data.success) {
        this.lessons = lessonsRes.data.data || []; // New structure
      } else {
        this.lessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : []; // Legacy structure
      }
      
      console.log('✅ Lessons loaded:', this.lessons.length);
    } catch (lessonError) {
      console.warn('⚠️ Could not load lessons:', lessonError.response?.status);
      // If lessons endpoint fails, try to get lessons from topic data
      if (this.topic && this.topic.lessons) {
        this.lessons = this.topic.lessons;
        console.log('✅ Using lessons from topic data:', this.lessons.length);
      } else {
        this.lessons = [];
      }
    }

  } catch (err) {
    console.error('❌ Error loading topic:', err.response?.status, err.response?.data || err.message);
    
    // Better error handling
    if (err.response?.status === 404) {
      console.error('❌ Topic not found');
      alert('❌ Тема не найдена');
    } else if (err.response?.status === 400) {
      console.error('❌ Invalid topic ID');
      alert('❌ Неверный ID темы');
    } else {
      console.error('❌ Server error');
      alert('❌ Ошибка сервера');
    }
    
    this.topic = null;
    this.lessons = [];
  } finally {
    this.loading = false;
  }
},
  methods: {
    startLesson(lesson) {
      if (lesson.type === 'premium' && !this.isPremiumUser) {
        alert('❌ Этот урок доступен только подписчикам.');
        return;
      }
      this.$router.push({ name: 'LessonPage', params: { id: lesson._id } });
    },
    startFirstLesson() {
      const first = this.lessons.find(
        l => l.type !== 'premium' || this.isPremiumUser
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
  max-width: 960px;
  margin: 0 auto;
  padding: 50px 24px;
  font-family: 'Unbounded', sans-serif;
  color: #1f2937;
}

.loading,
.error {
  text-align: center;
  font-size: 1.2rem;
  color: #6b7280;
}

.title {
  font-size: 2.8rem;
  font-weight: 700;
  color: #5b21b6;
  margin-bottom: 24px;
  text-align: center;
}

.description {
  font-size: 1.2rem;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 36px;
  text-align: center;
}

.lesson-list h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #6b21a8;
}

.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 8px rgba(93, 97, 120, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lesson-item:hover {
  transform: scale(1.01);
  box-shadow: 0 6px 12px rgba(93, 97, 120, 0.12);
}

.lesson-item.locked {
  opacity: 0.5;
  pointer-events: none;
}

.lesson-item button {
  padding: 8px 18px;
  background: linear-gradient(to right, #7c3aed, #6d28d9);
  color: #fff;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s ease;
}

.lesson-item button:hover {
  transform: scale(1.05);
  background: linear-gradient(to right, #5b21b6, #6b21a8);
}

.start-button-wrapper {
  text-align: center;
  margin-top: 50px;
}

.start-course-btn {
  padding: 16px 36px;
  font-size: 1.2rem;
  font-weight: 600;
  background: linear-gradient(to right, #6d28d9, #7c3aed);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s ease;
}

.start-course-btn:hover {
  transform: scale(1.05);
  background: linear-gradient(to right, #5b21b6, #6b21a8);
}
</style>
