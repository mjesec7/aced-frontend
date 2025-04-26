<template>
  <div class="lessons-page">
    <h1 class="page-title">📚 Бесплатные Уроки</h1>

    <div v-if="loading" class="loading">Загрузка бесплатных уроков...</div>

    <div v-else-if="lessons.length" class="lessons-grid">
      <div v-for="lesson in lessons" :key="lesson._id" class="lesson-card">
        <div class="card-header">
          <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
          <button class="add-btn" @click="addToStudyPlan(lesson)">＋</button>
        </div>
        <p class="lesson-topic">{{ lesson.topic }}</p>
        <span class="subject-badge">{{ lesson.subject }}</span>

        <button class="start-btn" @click="startLesson(lesson._id)">Начать</button>
      </div>
    </div>

    <div v-else class="no-lessons">
      ❌ Бесплатные уроки пока недоступны.
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { mapState } from 'vuex';

export default {
  name: 'FreeLessons',
  data() {
    return {
      lessons: [],
      loading: true,
    };
  },
  computed: {
    ...mapState(['firebaseUserId']),
  },
  mounted() {
    this.loadFreeLessons();
  },
  methods: {
    async loadFreeLessons() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/lessons?type=free`);
        this.lessons = response.data;
      } catch (error) {
        console.error('❌ Ошибка загрузки бесплатных уроков:', error);
      } finally {
        this.loading = false;
      }
    },

    startLesson(lessonId) {
      if (!lessonId) {
        console.error('❌ Нет ID урока для старта.');
        return;
      }
      this.$router.push(`/lesson/${lessonId}`);
    },

    async addToStudyPlan(lesson) {
      if (!this.firebaseUserId) {
        alert('⚠️ Чтобы добавить урок в план, войдите в аккаунт.');
        return;
      }

      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/users/${this.firebaseUserId}/study-list`, {
          subject: lesson.subject,
          topic: lesson.topic,
        });
        alert(`✅ Урок "${lesson.lessonName}" добавлен в ваш учебный план!`);
      } catch (error) {
        console.error('❌ Ошибка добавления урока в учебный план:', error);
      }
    }
  }
};
</script>

<style scoped>
.lessons-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

.page-title {
  font-size: 2.4rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 40px;
  text-align: center;
}

.loading, .no-lessons {
  text-align: center;
  font-size: 1.1rem;
  color: #6b7280;
  margin-top: 60px;
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.lesson-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.3s ease;
}

.lesson-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lesson-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
}

.lesson-topic {
  font-size: 1rem;
  color: #6b7280;
  margin-top: 8px;
}

.subject-badge {
  display: inline-block;
  background: linear-gradient(to right, #7c3aed, #ec4899);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  margin-top: 10px;
}

.add-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  font-size: 1.4rem;
  cursor: pointer;
  transition: background 0.3s;
}

.add-btn:hover {
  background: #059669;
}

.start-btn {
  margin-top: 20px;
  background: linear-gradient(to right, #60a5fa, #818cf8);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;
}

.start-btn:hover {
  background: linear-gradient(to right, #3b82f6, #6366f1);
}
</style>
