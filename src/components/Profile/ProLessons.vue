<template>
  <div class="lessons-page">
    <h1 class="page-title">🎓 Премиум Уроки</h1>

    <div v-if="loading" class="loading">Загрузка премиум уроков...</div>

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
      ❌ Премиум уроки пока недоступны.
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { mapState } from 'vuex';

export default {
  name: 'ProLessons',
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
    this.loadProLessons();
  },
  methods: {
    async loadProLessons() {
      try {
        const { data } = await axios.get(`${process.env.VUE_APP_API_URL}/lessons`);
        if (Array.isArray(data)) {
          this.lessons = data.filter(lesson => lesson.type === 'premium');
          console.log(`✅ Загрузено ${this.lessons.length} премиум уроков`);
        } else {
          console.error('❌ Неверный формат данных при загрузке уроков.');
          this.lessons = [];
        }
      } catch (error) {
        console.error('❌ Ошибка при загрузке премиум уроков:', error.response?.data || error.message);
      } finally {
        this.loading = false;
      }
    },

    startLesson(lessonId) {
      if (!lessonId) {
        console.error('❌ [Ошибка старта урока] ID урока отсутствует.');
        return;
      }
      console.log(`🚀 Переход к премиум уроку ID: ${lessonId}`);
      this.$router.push({ name: 'LessonView', params: { id: lessonId } });
    },

    async addToStudyPlan(lesson) {
      if (!this.firebaseUserId) {
        alert('⚠️ Чтобы добавить урок в план, войдите в аккаунт.');
        console.warn('⚠️ Попытка добавить премиум урок без авторизации.');
        return;
      }

      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/users/${this.firebaseUserId}/study-list`, {
          subject: lesson.subject,
          topic: lesson.topic,
        });
        alert(`✅ Урок "${lesson.lessonName}" успешно добавлен в ваш учебный план!`);
        console.log(`✅ Премиум урок "${lesson.lessonName}" добавлен в план пользователя ID: ${this.firebaseUserId}`);
      } catch (error) {
        console.error('❌ Ошибка добавления премиум урока в план:', error.response?.data || error.message);
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
  color: #9ca3af;
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
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.3s ease;
  cursor: default;
  position: relative;
}

.lesson-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 10px 28px rgba(147, 51, 234, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lesson-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
}

.lesson-topic {
  font-size: 1rem;
  color: #6b7280;
  margin-top: 10px;
}

.subject-badge {
  font-size: 0.75rem;
  padding: 6px 12px;
  background: linear-gradient(to right, #8b5cf6, #ec4899);
  color: white;
  border-radius: 20px;
  display: inline-block;
  font-weight: 600;
  margin-top: 10px;
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
  transition: background 0.3s ease;
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
  transition: background 0.3s ease;
}
.start-btn:hover {
  background: linear-gradient(to right, #3b82f6, #6366f1);
}
</style>
