<template>
  <div class="lesson-page">
    <div v-if="loading" class="loading">Загрузка урока...</div>

    <div v-else class="lesson-content">
      <!-- Левая панель -->
      <div class="left-panel">
        <h2 class="lesson-title">{{ lesson.lessonName }}</h2>

        <div v-if="currentStep === 0" class="section">
          <h3>📚 Объяснение</h3>
          <div v-html="lesson.explanation"></div>
        </div>

        <div v-else-if="currentStep === 1" class="section">
          <h3>🧩 Примеры</h3>
          <div v-html="lesson.examples"></div>
        </div>

        <div v-else-if="currentStep >= 2 && currentStep < exerciseSteps" class="section">
          <h3>✏️ Упражнение {{ currentStep - 1 }}</h3>
          <p>{{ currentExercise.question }}</p>
          <button class="hint-btn" @click="showHint = !showHint">💡 Подсказка</button>
          <div v-if="showHint" class="hint-box">{{ currentExercise.hint || 'Подсказка недоступна.' }}</div>
        </div>

        <div v-else-if="currentStep === exerciseSteps" class="section">
          <h3>🧠 Квиз</h3>
          <p>{{ currentQuiz.question }}</p>
          <ul>
            <li v-for="option in currentQuiz.options" :key="option">{{ option }}</li>
          </ul>
        </div>

        <div v-else class="section">
          <h3>🏆 Урок завершён!</h3>
          <p>Вы завершили все этапы!</p>
        </div>
      </div>

      <!-- Правая панель -->
      <div class="right-panel" v-if="showInput">
        <h3>✏️ Практическая зона</h3>
        <textarea v-model="userAnswer" placeholder="Введите ваш ответ..."></textarea>
        <button class="submit-btn" @click="submitAnswer">Отправить</button>
        <div v-if="confirmation" class="confirmation">{{ confirmation }}</div>
      </div>
    </div>

    <!-- Навигация -->
    <div class="lesson-navigation">
      <button class="nav-btn" @click="goPrevious" :disabled="currentStep === 0">⬅️ Назад</button>
      <button class="nav-btn" @click="goNext">➡️ Далее</button>
    </div>

    <!-- Иконка AI Чата -->
    <div class="ai-chat-button" @click="chatOpen = !chatOpen">
      🤖
    </div>

    <!-- Модалка чата -->
    <div v-if="chatOpen" class="ai-chat-modal">
      <h3>Чат с AI</h3>
      <textarea v-model="chatInput" placeholder="Ваш вопрос..." />
      <button class="ask-btn" @click="askAI">Отправить</button>
      <div v-if="aiResponse" class="ai-response">{{ aiResponse }}</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { getAIResponse } from '../services/GPTService';

export default {
  name: 'LessonPage',
  data() {
    return {
      lesson: {},
      allLessons: [],
      loading: true,
      userAnswer: '',
      confirmation: '',
      currentStep: 0,
      completedLessons: new Set(),
      showHint: false,
      chatOpen: false,
      chatInput: '',
      aiResponse: '',
    }
  },
  computed: {
    exerciseSteps() {
      return 2 + (this.lesson.exercises?.length || 0);
    },
    currentExercise() {
      if (this.lesson.exercises && this.currentStep >= 2 && this.currentStep < this.exerciseSteps) {
        return this.lesson.exercises[this.currentStep - 2];
      }
      return {};
    },
    currentQuiz() {
      if (this.lesson.quiz && this.lesson.quiz.length > 0) {
        return this.lesson.quiz[0];
      }
      return {};
    },
    showInput() {
      return this.currentStep >= 2 && this.currentStep <= this.exerciseSteps;
    }
  },
  async mounted() {
    await this.loadLesson();
  },
  methods: {
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        const res = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/${lessonId}`);
        this.lesson = res.data;

        if (this.lesson.topicId) {
          const topicRes = await axios.get(`${process.env.VUE_APP_API_URL}/lessons/topic/${this.lesson.topicId}`);
          this.allLessons = topicRes.data;
        }

        this.loading = false;
      } catch (err) {
        console.error('❌ Ошибка загрузки урока:', err);
        this.loading = false;
      }
    },
    submitAnswer() {
      if (!this.userAnswer.trim()) {
        this.confirmation = '⚠️ Пожалуйста, введите ответ.';
        return;
      }
      this.confirmation = '✅ Ответ отправлен!';
      this.userAnswer = '';
    },
    goPrevious() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.userAnswer = '';
        this.confirmation = '';
      }
    },
    async goNext() {
      if (this.currentStep < this.exerciseSteps) {
        this.currentStep++;
        this.userAnswer = '';
        this.confirmation = '';
      } else {
        await this.goToNextLesson();
      }
    },
    async goToNextLesson() {
      const currentLessonId = this.lesson._id;
      const currentIndex = this.allLessons.findIndex(l => l._id === currentLessonId);

      if (!this.completedLessons.has(currentLessonId)) {
        this.completedLessons.add(currentLessonId);
      }

      if (currentIndex >= 0 && currentIndex + 1 < this.allLessons.length) {
        const nextLessonId = this.allLessons[currentIndex + 1]._id;
        this.$router.push({ name: 'LessonView', params: { id: nextLessonId } });
      } else {
        const performance = Math.round((this.completedLessons.size / this.allLessons.length) * 100);
        this.$router.push({ name: 'TopicFinished', query: { performance } });
      }
    },
    async askAI() {
      if (!this.chatInput.trim()) return;
      try {
        this.aiResponse = '⌛ Пишем ответ...';
        const res = await getAIResponse(this.chatInput);
        this.aiResponse = res;
      } catch (error) {
        console.error('Ошибка чата с AI:', error);
        this.aiResponse = '❌ Ошибка получения ответа.';
      }
    }
  }
}
</script>
  
  <style scoped>
  /* Все стили: футуризм + плавные переходы */
  .lesson-page {
    padding: 20px;
    font-family: 'Inter', sans-serif;
    background: #f9fafb;
    min-height: 100vh;
    position: relative;
  }
  
  .lesson-content {
    display: flex;
    gap: 24px;
    margin-bottom: 30px;
  }
  
  .left-panel, .right-panel {
    flex: 1;
    min-width: 300px;
    background: white;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
    position: relative;
  }
  
  .hint-button {
    position: absolute;
    top: 20px;
    right: 20px;
    background: #facc15;
    padding: 8px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1.4rem;
  }
  
  .hints-box {
    margin-top: 20px;
    padding: 16px;
    background: #fef9c3;
    border-radius: 12px;
  }
  
  .lesson-title {
    font-size: 2rem;
    font-weight: 800;
    color: #7c3aed;
  }
  
  .section h3 {
    margin-bottom: 8px;
    font-size: 1.3rem;
    color: #6d28d9;
  }
  
  textarea {
    width: 100%;
    min-height: 120px;
    border-radius: 10px;
    padding: 12px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
  }
  
  .submit-btn {
    margin-top: 16px;
    padding: 10px 20px;
    background: linear-gradient(to right, #60a5fa, #c084fc);
    color: white;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
  }
  
  .lesson-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
  }
  
  .nav-btn {
    padding: 10px 24px;
    background: linear-gradient(to right, #f472b6, #ec4899);
    color: white;
    font-weight: 700;
    border-radius: 12px;
  }
  
  .chatbot-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #6366f1;
    color: white;
    padding: 14px;
    font-size: 1.6rem;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .chat-window {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 300px;
    background: white;
    padding: 20px;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  .chat-send, .chat-close {
    margin-top: 10px;
    width: 100%;
    padding: 10px;
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
  }
  
  .return-btn {
    margin-top: 20px;
    background: #34d399;
    padding: 12px 24px;
    border: none;
    color: white;
    font-weight: 700;
    border-radius: 12px;
  }
  
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
  </style>