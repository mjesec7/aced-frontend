<template>
    <div class="homework-list-wrapper">
      <h1>Домашние задания</h1>
  
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="homeworks.length === 0" class="empty">Нет домашних заданий.</div>
  
      <div v-else class="homework-cards">
        <div v-for="hw in homeworks" :key="hw.lessonId" class="homework-card">
          <h3>{{ hw.lessonName || 'Без названия' }}</h3>
          <p>
            Статус:
            <span v-if="!hw.record">Не начато</span>
            <span v-else-if="!hw.record.completed">В процессе</span>
            <span v-else>Завершено ({{ hw.record.score }}%)</span>
          </p>
          <button @click="goToHomework(hw.lessonId)">Перейти к домашке →</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import api from '@/api'; // ✅ centralized axios instance
  import { auth } from '@/firebase';
  
  export default {
    name: 'HomeworkList',
    data() {
      return {
        homeworks: [],
        loading: true,
      };
    },
    methods: {
      goToHomework(lessonId) {
        this.$router.push(`/profile/homeworks/${lessonId}`);
      },
      async fetchHomeworks() {
        try {
          this.loading = true;
  
          const user = auth.currentUser;
          if (!user) throw new Error('Пользователь не авторизован');
  
          const token = await user.getIdToken();
          const userId = user.uid;
  
          // ✅ Use centralized api instead of axios
          const { data: progressRes } = await api.get(`/users/${userId}/homeworks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
  
          const progressMap = {};
          for (const hw of progressRes.data) {
            progressMap[hw.lessonId] = hw;
          }
  
          const { data: lessonsRes } = await api.get(`/lessons`);
          const homeworkLessons = lessonsRes.data.filter(lesson => lesson.homework?.length > 0);
  
          this.homeworks = homeworkLessons.map(lesson => ({
            lessonId: lesson._id,
            lessonName: lesson.lessonName,
            record: progressMap[lesson._id] || null
          }));
        } catch (err) {
          console.error('❌ Ошибка загрузки домашних заданий:', err);
          this.$toast?.error('Ошибка загрузки домашних заданий.');
        } finally {
          this.loading = false;
        }
      }
    },
    mounted() {
      this.fetchHomeworks();
    }
  };
  </script>
  
  <style scoped>
  .homework-list-wrapper {
    max-width: 800px;
    margin: auto;
    padding: 2rem;
  }
  
  .loading,
  .empty {
    text-align: center;
    font-size: 1.2rem;
    color: #888;
    margin-top: 2rem;
  }
  
  .homework-cards {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .homework-card {
    border: 1px solid #ddd;
    padding: 1.2rem;
    border-radius: 10px;
    background-color: #fafafa;
  }
  
  .homework-card h3 {
    margin: 0 0 0.5rem 0;
  }
  
  .homework-card p {
    margin: 0.5rem 0;
  }
  
  .homework-card button {
    background-color: #6a5acd;
    color: white;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 6px;
    cursor: pointer;
  }
  </style>
  