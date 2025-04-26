<template>
  <div class="lessons-page">
    <h1 class="page-title">Бесплатные Уроки</h1>

    <div v-if="loading" class="loading">Loading lessons...</div>

    <div v-else-if="lessons.length" class="lessons-grid">
      <div
        v-for="lesson in lessons"
        :key="lesson._id"
        class="lesson-card"
        @click="goToLesson(lesson._id)"
      >
        <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
        <p class="lesson-topic">{{ lesson.topic }}</p>
        <span class="subject-badge">{{ lesson.subject }}</span>
      </div>
    </div>

    <div v-else class="no-lessons">
      ❌ No free lessons available yet.
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FreeLessons',
  data() {
    return {
      lessons: [],
      loading: true,
    }
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API_URL}/lessons?type=free`)
      .then(res => {
        this.lessons = res.data
      })
      .catch(err => {
        console.error('❌ Failed to fetch lessons:', err)
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
      this.$router.push(`/lesson/${id}`)
    }
  }
}
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

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.lesson-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.lesson-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.25);
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
  display: inline-block;
  font-weight: 600;
  margin-top: 6px;
}

/* Loading and error */
.loading, .no-lessons {
  text-align: center;
  font-size: 1.1rem;
  color: #6b7280;
  margin-top: 60px;
}
</style>
