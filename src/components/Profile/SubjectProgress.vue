<template>
    <div class="subject-progress-page">
      <h1 class="page-title">📚 Мой Прогресс по Темам</h1>
  
      <div v-if="loading" class="loading">Загрузка прогресса...</div>
  
      <div v-else>
        <div v-if="progressData.length" class="progress-grid">
          <div v-for="topic in progressData" :key="topic._id" class="progress-card">
            <div class="top-section">
              <h2>{{ topic.topicName }}</h2>
              <img v-if="topic.medal" :src="getMedalImage(topic.medal)" alt="Medal" class="medal-img" />
            </div>
  
            <div class="progress-info">
              <p>Пройдено уроков: {{ topic.completedLessons }} из {{ topic.totalLessons }}</p>
              <p>Прогресс: {{ Math.round(topic.percent) }}%</p>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: topic.percent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
  
        <div v-else class="no-topics">
          Пока нет прогресса. Начните изучать темы!
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapState } from 'vuex';
  import axios from 'axios';
  
  export default {
    name: 'SubjectProgress',
    data() {
      return {
        loading: true,
        progressData: [],
      };
    },
    computed: {
      ...mapState(['firebaseUserId']),
    },
    mounted() {
      this.fetchProgress();
    },
    methods: {
        async fetchProgress() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.error('❌ Нет userId. Невозможно загрузить прогресс по темам.');
    return;
  }

  try {
    const response = await fetch(`${process.env.VUE_APP_API_URL}/user-analytics/topic-progress/${userId}`);
    if (!response.ok) {
      throw new Error('❌ Сервер вернул ошибку при получении прогресса по темам');
    }
    const data = await response.json();
    this.topicProgress = data;
  } catch (error) {
    console.error('❌ Ошибка загрузки прогресса по темам:', error);
  }
},

      getMedalImage(medal) {
        if (medal === 'gold') return require('@/assets/medals/gold.png');
        if (medal === 'silver') return require('@/assets/medals/silver.png');
        if (medal === 'bronze') return require('@/assets/medals/bronze.png');
        return '';
      }
    }
  }
  </script>
  
  <style scoped>
  .subject-progress-page {
    padding: 30px;
    font-family: 'Inter', sans-serif;
  }
  
  .page-title {
    text-align: center;
    font-size: 2.4rem;
    font-weight: 800;
    color: #7c3aed;
    margin-bottom: 40px;
  }
  
  .loading {
    text-align: center;
    margin-top: 60px;
    font-size: 1.3rem;
    color: #6b7280;
  }
  
  .progress-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
  
  .progress-card {
    background: white;
    padding: 20px;
    border-radius: 14px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.05);
  }
  
  .top-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .top-section h2 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #4c1d95;
  }
  
  .medal-img {
    width: 40px;
    height: 40px;
  }
  
  .progress-info {
    margin-top: 16px;
  }
  
  .progress-bar {
    background: #e5e7eb;
    height: 14px;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 10px;
  }
  
  .progress-fill {
    background: linear-gradient(to right, #8b5cf6, #60a5fa);
    height: 100%;
    transition: width 0.5s ease;
  }
  
  .no-topics {
    text-align: center;
    font-size: 1.2rem;
    margin-top: 50px;
    color: #9ca3af;
  }
  </style>
  