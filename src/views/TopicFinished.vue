<template>
    <div class="finished-page">
      <div id="confetti-holder"></div> <!-- Confetti Animation -->
  
      <div class="content">
        <h1>🎉 Поздравляем!</h1>
  
        <div class="medal-section">
          <img :src="medalImage" alt="Medal" class="medal-img" v-if="medalImage" />
          <p class="medal-text">{{ medalText }}</p>
        </div>
  
        <p>Вы завершили все уроки в этой теме!</p>
  
        <router-link to="/profile" class="back-btn">🏠 Вернуться на Дашборд</router-link>
      </div>
    </div>
  </template>
  
  <script>
  import confetti from 'canvas-confetti';
  
  export default {
    name: 'TopicFinished',
    data() {
      return {
        performance: 0, // % value
      };
    },
    computed: {
      medalImage() {
  if (this.performance >= 90) {
    return new URL('@/assets/medals/gold.png', import.meta.url).href;
  }
  if (this.performance >= 70) {
    return new URL('@/assets/medals/silver.png', import.meta.url).href;
  }
  if (this.performance >= 50) {
    return new URL('@/assets/medals/bronze.png', import.meta.url).href;
  }
  return null;
},

      medalText() {
        if (this.performance >= 90) return '🥇 Золотая медаль! Великолепно!';
        if (this.performance >= 70) return '🥈 Серебряная медаль! Отличная работа!';
        if (this.performance >= 50) return '🥉 Бронзовая медаль! Молодец!';
        return 'Продолжай учиться и ты получишь медаль!';
      }
    },
    mounted() {
      this.launchConfetti();
      this.performance = parseInt(this.$route.query.performance || 0); // Get performance from query params
    },
    methods: {
      launchConfetti() {
        const duration = 4 * 1000;
        const end = Date.now() + duration;
  
        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 70,
            origin: { x: 0 },
            colors: ['#8b5cf6', '#ec4899', '#60a5fa'],
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 70,
            origin: { x: 1 },
            colors: ['#8b5cf6', '#ec4899', '#60a5fa'],
          });
  
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }
    }
  };
  </script>
  
  <style scoped>
  .finished-page {
    min-height: 100vh;
    background: linear-gradient(to right, #8b5cf6, #ec4899);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    color: white;
    overflow: hidden;
    text-align: center;
  }
  
  .content {
    background: rgba(255, 255, 255, 0.1);
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
  }
  
  h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .medal-section {
    margin: 20px 0;
  }
  
  .medal-img {
    width: 120px;
    height: auto;
    margin-bottom: 10px;
  }
  
  .medal-text {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  p {
    font-size: 1.2rem;
    margin-bottom: 20px;
  }
  
  .back-btn {
    display: inline-block;
    padding: 12px 24px;
    background: white;
    color: #8b5cf6;
    font-weight: 700;
    font-size: 1rem;
    border-radius: 10px;
    transition: background 0.3s, transform 0.2s;
    text-decoration: none;
  }
  
  .back-btn:hover {
    background: #f9fafb;
    transform: scale(1.05);
  }
  </style>
  