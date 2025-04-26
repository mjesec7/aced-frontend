<template>
  <div class="lessons-page">
    <h1 class="page-title">Бесплатные Уроки</h1>

    <div v-if="loading" class="loading">Загрузка уроков...</div>

    <div v-else-if="lessons.length" class="lessons-grid">
      <div
        v-for="lesson in lessons"
        :key="lesson._id"
        class="lesson-card"
      >
        <div class="card-header">
          <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
          <button class="add-btn" @click="addToStudyPlan(lesson)">＋</button>
        </div>
        <p class="lesson-topic">{{ lesson.topic }}</p>
        <span class="subject-badge">{{ lesson.subject }}</span>

        <button class="start-btn" @click="goToLesson(lesson._id)">Начать</button>
      </div>
    </div>

    <div v-else class="no-lessons">
      ❌ Нет бесплатных уроков.
    </div>
  </div>
</template>

<script>
import { api, handleApiError } from '@/services/GPTService';
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
  async mounted() {
    await this.fetchLessons();
  },
  methods: {
    async fetchLessons() {
      try {
        const res = await api.get('/lessons?type=free');
        this.lessons = res.data;
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки бесплатных уроков');
      } finally {
        this.loading = false;
      }
    },
    goToLesson(id) {
      if (!id) {
        console.error('❌ Нет ID урока!');
        return;
      }
      this.$router.push(`/lesson/${id}`);
    },
    async addToStudyPlan(lesson) {
      try {
        if (!this.firebaseUserId) {
          alert('⚠️ Сначала войдите в аккаунт!');
          return;
        }
        await api.post(`/users/${this.firebaseUserId}/study-list`, {
          topicId: lesson.topicId,
        });
        alert(`✅ Урок "${lesson.lessonName}" добавлен в ваш план!`);
      } catch (error) {
        handleApiError(error, 'Ошибка добавления урока в план');
      }
    },
  },
};
</script>

<style scoped>
/* Your CSS is perfect, only small minor fixes I applied */

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
  transition: all 0.3s ease;
  cursor: default;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lesson-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.25);
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
  margin-bottom: 8px;
}

.lesson-topic {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 10px;
}

.subject-badge {
  font-size: 0.75rem;
  padding: 6px 12px;
  background: linear-gradient(to right, #9333ea, #ec4899);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  margin-top: 6px;
}

.add-btn {
  background: #10b981;
  color: white;
  font-size: 1.2rem;
  border: none;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: background 0.3s;
}
.add-btn:hover {
  background: #059669;
}

.start-btn {
  margin-top: 16px;
  background: linear-gradient(to right, #60a5fa, #818cf8);
  color: white;
  padding: 10px 16px;
  font-size: 0.9rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s;
}
.start-btn:hover {
  background: linear-gradient(to right, #3b82f6, #6366f1);
}

.loading, .no-lessons {
  text-align: center;
  font-size: 1.1rem;
  color: #6b7280;
  margin-top: 60px;
}
</style>
