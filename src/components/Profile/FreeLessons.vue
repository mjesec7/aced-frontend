<template>
    <div class="lessons-wrapper">
      <h1 class="title">Бесплатные Уроки</h1>
      <div class="lessons-grid">
        <div
          v-for="lesson in lessons"
          :key="lesson._id"
          class="lesson-card"
          @click="goToLesson(lesson._id)"
        >
          <h2>{{ lesson.lessonName }}</h2>
          <p>{{ lesson.topic }}</p>
          <span class="badge">{{ lesson.subject }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'FreeLessons',
    data() {
      return {
        lessons: []
      }
    },
    setup() {
      const router = useRouter()
      const goToLesson = (id) => router.push({ name: 'LessonView', params: { id } })
      return { goToLesson }
    },
    mounted() {
      axios.get('/api/lessons')
        .then(res => {
          this.lessons = res.data.filter(lesson => lesson.type === 'free')
        })
        .catch(err => {
          console.error('❌ Failed to fetch lessons:', err)
        })
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
    transition: 0.3s ease;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }
  
  .lesson-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15); /* bluish tone for free */
  }
  
  .lesson-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
  }
  
  .lesson-topic {
    font-size: 0.95rem;
    color: #6b7280;
    margin-bottom: 10px;
  }
  
  .subject-badge {
    font-size: 0.75rem;
    padding: 4px 10px;
    background: linear-gradient(to right, #3b82f6, #06b6d4);
    color: white;
    border-radius: 20px;
    display: inline-block;
    font-weight: 600;
  }
  </style>
  