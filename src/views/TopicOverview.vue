<template>
    <div class="topic-overview">
      <div v-if="loading" class="loading">Загрузка информации о курсе...</div>
  
      <div v-else-if="topic" class="topic-card">
        <h1 class="title">📘 {{ topic.name }}</h1>
        <p class="description">{{ topic.description || 'Нет описания для этой темы.' }}</p>
  
        <div class="lesson-list">
          <h2>📚 Уроки</h2>
          <ul>
            <li v-for="lesson in topic.lessons" :key="lesson._id" class="lesson-item">
              <span>{{ lesson.lessonName }}</span>
              <button @click="startLesson(lesson._id)">Начать</button>
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
        loading: true,
      };
    },
    async mounted() {
      const topicId = this.$route.params.id;
      try {
        const token = await auth.currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const { data } = await axios.get(`${BASE_URL}/topics/${topicId}`, { headers });
        this.topic = data;
      } catch (err) {
        console.error('❌ Ошибка загрузки темы:', err);
      } finally {
        this.loading = false;
      }
    },
    methods: {
      startLesson(lessonId) {
        if (!lessonId) return;
        this.$router.push({ name: 'LessonPage', params: { id: lessonId } });
      },
      startFirstLesson() {
        if (this.topic && this.topic.lessons?.length > 0) {
          const firstLessonId = this.topic.lessons[0]._id;
          this.startLesson(firstLessonId);
        } else {
          alert('❌ У этой темы пока нет уроков.');
        }
      },
    },
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
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 20px;
    color: #4f46e5;
  }
  
  .description {
    font-size: 1.1rem;
    color: #374151;
    margin-bottom: 30px;
  }
  
  .lesson-list h2 {
    font-size: 1.4rem;
    margin-bottom: 12px;
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
  
  .lesson-item button {
    padding: 6px 14px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  .lesson-item button:hover {
    background: #4f46e5;
  }
  
  .start-button-wrapper {
    text-align: center;
    margin-top: 40px;
  }
  
  .start-course-btn {
    padding: 14px 28px;
    font-size: 1.1rem;
    background: linear-gradient(to right, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: bold;
    cursor: pointer;
  }
  
  .start-course-btn:hover {
    background: linear-gradient(to right, #4f46e5, #7c3aed);
  }
  </style>
  