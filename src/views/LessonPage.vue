<template>
  <div class="lesson-page">
    <div v-if="loading" class="loading">Загрузка урока...</div>

    <div v-else class="lesson-content">
      <!-- Левая панель -->
      <div class="left-panel">
        <h2 class="lesson-title">{{ lesson.lessonName }}</h2>

        <div v-if="currentStep === 0" class="section">
          <h3>📚 Объяснение</h3>
          <div v-html="lesson.explanation || 'Нет объяснения'"></div>
        </div>

        <div v-else-if="currentStep === 1" class="section">
          <h3>📗 Примеры</h3>
          <div v-html="lesson.examples || 'Нет примеров'"></div>
        </div>

        <div v-else-if="currentStep >= 2 && currentStep < exerciseSteps" class="section">
          <h3>✏️ Упражнение {{ currentStep - 1 }}</h3>
          <p>{{ currentExercise.question || 'Вопрос отсутствует' }}</p>
          <button class="hint-btn" @click="showHint = !showHint">💡 Подсказка</button>
          <div v-if="showHint" class="hint-box">{{ currentExercise.hint || 'Подсказка недоступна' }}</div>
        </div>

        <div v-else-if="currentStep === exerciseSteps" class="section">
          <h3>🧠 Квиз</h3>
          <p>{{ currentQuiz.question || 'Вопрос отсутствует' }}</p>
          <ul>
            <li v-for="option in currentQuiz.options || []" :key="option">{{ option }}</li>
          </ul>
        </div>

        <div v-else class="section">
          <h3>🏆 Урок завершён!</h3>
          <p>Вы прошли все этапы!</p>
          <button class="return-btn" @click="$router.push('/profile')">Вернуться в профиль</button>
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

    <!-- AI Чат -->
    <div class="chatbot-button" @click="chatOpen = !chatOpen">
      🤖
    </div>

    <transition name="fade">
      <div v-if="chatOpen" class="chat-window">
        <h3>Чат с AI</h3>
        <textarea v-model="chatInput" placeholder="Ваш вопрос..."></textarea>
        <button class="chat-send" @click="askAI">Отправить</button>
        <div v-if="aiResponse" class="ai-response">{{ aiResponse }}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios';
import { getAIResponse } from '@/services/GPTService';

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
    };
  },
  computed: {
    exerciseSteps() {
      return 2 + (this.lesson.exercises?.length || 0);
    },
    currentExercise() {
      return this.lesson.exercises?.[this.currentStep - 2] || {};
    },
    currentQuiz() {
      return this.lesson.quiz?.[0] || {};
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
};
</script>

<style scoped>
.lesson-page {
  padding: 20px;
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  min-height: 100vh;
  position: relative;
}

.lesson-content {
  display: flex;
  gap: 20px;
}

.left-panel {
  flex: 2;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

.right-panel {
  flex: 1;
  background: #f1f5f9;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

.lesson-title {
  font-size: 2rem;
  font-weight: 800;
  color: black;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 10px;
  background: white;
  border: 1px solid #d1d5db;
}

.submit-btn {
  margin-top: 16px;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: white;
  font-weight: 700;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
}

.lesson-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.nav-btn {
  padding: 10px 24px;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: white;
  font-weight: 700;
  border: none;
  border-radius: 12px;
}

.chatbot-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #7c3aed;
  color: white;
  padding: 14px;
  border-radius: 50%;
  font-size: 1.8rem;
  cursor: pointer;
}

.chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 300px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.2);
}

.chat-send {
  margin-top: 10px;
  width: 100%;
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
  color: white;
  padding: 10px;
  border: none;
  border-radius: 10px;
}
.ai-response {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #374151;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
