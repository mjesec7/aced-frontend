<template>
    <div class="lessons-page">
      <h1 class="page-title">Премиум Уроки</h1>
  
      <div v-if="filteredLessons.length > 0" class="lessons-grid">
        <div
          v-for="lesson in filteredLessons"
          :key="lesson._id"
          class="lesson-card"
          @click="goToLesson(lesson._id)"
        >
          <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
          <p class="lesson-topic">{{ lesson.topic }}</p>
          <span class="badge">{{ lesson.subject }}</span>
        </div>
      </div>
  
      <p v-else class="no-lessons">Нет доступных премиум уроков.</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'ProLessons',
    data() {
      return {
        lessons: []
      }
    },
    computed: {
      filteredLessons() {
        return this.lessons.filter(l => l.type === 'premium')
      }
    },
    setup() {
      const router = useRouter()
      const goToLesson = (id) => {
        router.push({ name: 'LessonView', params: { id } })
      }
      return { goToLesson }
    },
    mounted() {
      axios.get('/api/lessons')
        .then(res => {
          this.lessons = res.data
        })
        .catch(err => {
          console.error('❌ Ошибка загрузки уроков:', err)
        })
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
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    cursor: pointer;
    transition: 0.3s ease;
  }
  
  .lesson-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(147, 51, 234, 0.15);
  }
  
  .lesson-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  
  .lesson-topic {
    font-size: 0.95rem;
    color: #6b7280;
    margin-bottom: 10px;
  }
  
  .badge {
    font-size: 0.75rem;
    padding: 4px 10px;
    background: linear-gradient(to right, #8b5cf6, #ec4899);
    color: white;
    border-radius: 20px;
    display: inline-block;
    font-weight: 600;
  }
  
  .no-lessons {
    text-align: center;
    margin-top: 40px;
    color: #9ca3af;
  }
  </style>
  