<template>
  <div class="lessons-page">
    <h1 class="page-title">Премиум Уроки</h1>

    <div v-if="loading" class="loading">Loading premium lessons...</div>

    <div v-else-if="lessons.length > 0" class="lessons-grid">
      <div
        v-for="lesson in lessons"
        :key="lesson._id"
        class="lesson-card"
        @click="goToLesson(lesson._id)"
      >
        <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
        <p class="lesson-topic">{{ lesson.topic }}</p>
        <span class="badge">{{ lesson.subject }}</span>
      </div>
    </div>

    <p v-else class="no-lessons">❌ Нет доступных премиум уроков.</p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ProLessons',
  data() {
    return {
      lessons: [],
      loading: true,
    }
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API_URL}/lessons?type=premium`)
      .then(res => {
        this.lessons = res.data
      })
      .catch(err => {
        console.error('❌ Ошибка загрузки уроков:', err)
      })
      .finally(() => {
        this.loading = false
      })
  },
  methods: {
    goToLesson(id) {
      if (!id) {
        console.error('❌ No lesson ID provided!');
        return;
      }
      this.$router.push(`/lesson/${id}`);
    }
  }
}
</script>

<style scoped>
.lessons-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: auto;
  font-family: 'Inter', sans-serif;
}

.page-title {
  font-size: 2.4rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 30px;
  text-align: center;
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.lesson-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.lesson-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 10px 28px rgba(147, 51, 234, 0.25);
}

.lesson-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.lesson-topic {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 10px;
}

.badge {
  font-size: 0.75rem;
  padding: 6px 12px;
  background: linear-gradient(to right, #8b5cf6, #ec4899);
  color: white;
  border-radius: 20px;
  display: inline-block;
  font-weight: 600;
}

.loading, .no-lessons {
  text-align: center;
  font-size: 1.1rem;
  color: #9ca3af;
  margin-top: 60px;
}
</style>
