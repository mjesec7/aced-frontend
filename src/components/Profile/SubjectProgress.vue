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
  import { auth } from '@/firebase'; // ✅ Import Firebase auth
  
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
        const userId = this.firebaseUserId;
        if (!userId) {
          console.error('❌ Нет userId в Vuex. Невозможно загрузить прогресс по темам.');
          this.loading = false;
          return;
        }
  
        try {
          const token = await auth.currentUser.getIdToken(); // ✅ Get token
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/user-analytics/topic-progress/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`, // ✅ Attach token
              },
            }
          );
  
          if (!response.ok) {
            throw new Error('❌ Сервер вернул ошибку при получении прогресса по темам');
          }
  
          const data = await response.json();
          this.progressData = data;
        } catch (error) {
          console.error('❌ Ошибка загрузки прогресса по темам:', error);
        } finally {
          this.loading = false;
        }
      },
  
      getMedalImage(medal) {
  if (medal === 'gold') {
    return new URL('@/assets/medals/gold.png', import.meta.url).href;
  }
  if (medal === 'silver') {
    return new URL('@/assets/medals/silver.png', import.meta.url).href;
  }
  if (medal === 'bronze') {
    return new URL('@/assets/medals/bronze.png', import.meta.url).href;
  }
  return '';
}

    }
  };
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
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
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
  