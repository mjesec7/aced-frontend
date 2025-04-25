<template>
  <transition name="slide-down">
    <div v-if="lessonData">
      <div class="lesson-header">
        <h2>{{ lessonData.lessonName }}</h2>
        <p>
          {{ lessonData.subject }} • Level {{ lessonData.level }} • Topic: {{ lessonData.topic }}
        </p>
        <div class="badge" v-if="lessonData.isPremium">🌟 Premium</div>
      </div>
    </div>
  </transition>
  <div v-if="!lessonData" class="loading">Загрузка информации об уроке...</div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'LessonHeader',
  props: {
    lessonId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      lessonData: null
    }
  },
  mounted() {
    axios.get(`${process.env.VUE_APP_API_URL}/lessons/${this.lessonId}`)
      .then(res => {
        this.lessonData = res.data;
      })
      .catch(err => {
        console.error('Ошибка загрузки данных урока:', err);
      });
  }
}
</script>

<style scoped>
/* Slide-down transition */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.4s ease;
}
.slide-down-enter, .slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.lesson-header {
  padding: 20px;
  background: #f9f9ff;
  border-bottom: 1px solid #e5e7eb;
  font-family: 'Inter', sans-serif;
}
h2 {
  font-size: 1.5rem;
  margin-bottom: 6px;
  font-weight: 700;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(to right, #9333ea, #ec4899);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-top: 8px;
}
.loading {
  padding: 20px;
  font-style: italic;
  color: #666;
}
</style>