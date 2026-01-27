<template>
    <div class="finished-page">
      <div id="confetti-holder"></div> <!-- Confetti Animation -->

      <div class="content">
        <h1>🎉 {{ $t('topicFinished.congratulations') }}</h1>

        <div class="medal-section">
          <img :src="medalImage" alt="Medal" class="medal-img" v-if="medalImage" />
          <p class="medal-text">{{ medalText }}</p>
        </div>

        <p>{{ $t('topicFinished.completed') }}</p>

        <router-link to="/profile" class="back-btn">🏠 {{ $t('topicFinished.returnToDashboard') }}</router-link>
      </div>

      <!-- Rating Modal -->
      <RatingModal
        :show="showRatingModal"
        :lesson-id="lessonId"
        :lesson-name="courseName"
        :course-id="courseId"
        @close="handleRatingClose"
        @submit="handleRatingSubmit"
      />
    </div>
  </template>
  
  <script>
  import confetti from 'canvas-confetti';
  import RatingModal from '@/components/Modals/RatingModal.vue';
  import api from '@/api';
  import { auth } from '@/firebase';

  export default {
    name: 'TopicFinished',
    components: {
      RatingModal
    },
    data() {
      return {
        performance: 0, // % value
        showRatingModal: false,
        courseId: null,
        lessonId: null,
        courseName: ''
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
        if (this.performance >= 90) return '🥇 ' + this.$t('topicFinished.goldMedal');
        if (this.performance >= 70) return '🥈 ' + this.$t('topicFinished.silverMedal');
        if (this.performance >= 50) return '🥉 ' + this.$t('topicFinished.bronzeMedal');
        return this.$t('topicFinished.keepLearning');
      }
    },
    mounted() {
      this.launchConfetti();
      this.performance = parseInt(this.$route.query.performance || 0);
      this.courseId = this.$route.query.courseId || this.$route.params.topicId;
      this.lessonId = this.$route.query.lessonId;
      this.courseName = this.$route.query.courseName || this.$t('topicFinished.courseTitle');

      // Show rating modal after 3 seconds (after confetti celebration)
      setTimeout(() => {
        this.showRatingModal = true;
      }, 3000);
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
      },

      handleRatingClose() {
        this.showRatingModal = false;
      },

      async handleRatingSubmit(ratingData) {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const token = await user.getIdToken();

          // Submit rating to backend
          await api.post('/ratings', {
            userId: user.uid,
            courseId: ratingData.courseId,
            lessonId: ratingData.lessonId,
            rating: ratingData.rating,
            feedback: ratingData.feedback,
            timestamp: new Date().toISOString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          this.showRatingModal = false;
        } catch (error) {
          console.error('Failed to submit rating:', error);
          this.showRatingModal = false;
        }
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
  