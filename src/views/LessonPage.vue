<template>
  <div class="lesson-page">
    <!-- 🔘 Floating AI Chat Button -->
    <button class="ai-help-btn" @click="toggleAiChat">🤖 AI Помощь</button>

    <!-- 💬 AI Chat Modal -->
    <div class="ai-chat-modal" v-if="showAiChat">
      <div class="ai-chat-header">
        <h4>🤖 AI Помощник</h4>
        <button class="ai-close-btn" @click="toggleAiChat">✖</button>
      </div>
      <div class="ai-chat-body">
        <div class="chat-message ai">Привет! Вставьте ID урока из ссылки, и я объясню тему.</div>
        <div class="chat-message user" v-if="lessonId">ID: {{ lessonId }}</div>
        <div class="chat-message ai" v-if="aiExplanation">{{ aiExplanation }}</div>
      </div>
    </div>

    <!-- 🧠 Lesson Page Content -->
    <div v-if="!started" class="intro-screen">
      <button class="exit-btn" @click="confirmExit">❌</button>
      <h2 class="lesson-title">{{ lesson.lessonName || 'Без названия' }}</h2>
      <p>⏱️ Время прохождения: ~10 минут</p>
      <p>📌 Что вы узнаете: {{ lesson.description || 'описание недоступно' }}</p>
      <button class="start-btn" @click="startLesson">Начать урок</button>
    </div>

    <div v-else class="lesson-split">
      <div class="lesson-left">
        <div class="lesson-header">
          <h2 class="lesson-title">{{ lesson.lessonName }}</h2>
          <div class="timer-display">⏱ {{ formattedTime }}</div>
        </div>

        <div v-if="!lessonCompleted">
          <div class="section explanation-block">
            <h3>📚 Объяснение</h3>
            <div v-html="lesson.explanation || 'Нет объяснения'" class="explanation-text"></div>
          </div>

          <div class="section example-block">
            <h3>📗 Примеры</h3>
            <div v-html="lesson.examples || 'Нет примеров'" class="example-text"></div>
          </div>

          <div class="navigation-area">
            <button class="confirm-btn" @click="confirmUnderstanding" :disabled="understood">Понял</button>
            <button class="nav-btn" @click="goNext" :disabled="!canProceed">Далее</button>
          </div>
        </div>

        <div v-else class="congrats-section">
          <h3>🏆 Урок завершён!</h3>
          <p>Вы прошли все этапы!</p>
          <img :src="medalImage" alt="Медаль" class="medal-image" />
        </div>
      </div>

      <div class="lesson-right">
        <h3>✏️ Практическая зона</h3>
        <div v-if="understood && !lessonCompleted">
          <template v-if="currentExercise.options">
            <p class="exercise-question">{{ currentExercise.question || 'Вопрос отсутствует' }}</p>
            <div class="exercise-options">
              <label v-for="(opt, i) in currentExercise.options" :key="i">
                <input type="radio" :value="opt.option || opt" v-model="userAnswer" /> {{ opt.option || opt }}
              </label>
            </div>
          </template>
          <template v-else>
            <p class="exercise-question">{{ currentExercise.question || 'Вопрос отсутствует' }}</p>
            <p v-if="currentExercise.instruction" class="exercise-hint">💡 {{ currentExercise.instruction }}</p>
            <textarea v-model="userAnswer" placeholder="Введите ваш ответ..."></textarea>
          </template>
          <button class="submit-btn" @click="submitAnswer">Готово</button>
          <div v-if="confirmation" class="confirmation">{{ confirmation }}</div>
        </div>
        <div v-else-if="!understood">
          <div class="locked-overlay">⛔ Заблокировано до нажатия "Понял"</div>
        </div>
      </div>
    </div>

    <div v-if="showExitModal" class="modal">
      <div class="modal-content">
        <p>Вы уверены, что хотите выйти? Прогресс будет потерян.</p>
        <button @click="cancelExit">Отмена</button>
        <button @click="exitLesson">Выйти</button>
      </div>
    </div>

    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import axios from 'axios';
import confetti from 'canvas-confetti';
import { auth } from '@/firebase';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'LessonPage',
  data() {
    return {
      lesson: {},
      userId: null,
      loading: true,
      started: false,
      startTime: null,
      timerInterval: null,
      currentStep: 0,
      understood: false,
      userAnswer: '',
      confirmation: '',
      mistakeCount: 0,
      lessonCompleted: false,
      showExitModal: false,
      showConfetti: false,
      medalImage: '',
      attemptCount: 0,
      showAiChat: false,
      aiExplanation: '',
    };
  },
  computed: {
    lessonId() {
      return this.$route.params.id;
    },
    exerciseSteps() {
      return 2 + (this.lesson.exercises?.length || 0);
    },
    currentExercise() {
      const index = this.currentStep - 2;
      return index < 0 ? {} : (this.lesson.exercises[index] || {});
    },
    formattedTime() {
      if (!this.startTime) return '0:00';
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      return `${Math.floor(elapsed / 60)}:${elapsed % 60 < 10 ? '0' : ''}${elapsed % 60}`;
    },
    canProceed() {
      return this.understood && this.confirmation.includes('✅');
    }
  },
  async mounted() {
    const id = this.$route.params.id;
    const userId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    this.userId = userId;
    try {
      const { data } = await axios.get(`${BASE_URL}/lessons/${id}`);
      this.lesson = data;
    } catch (err) {
      console.error('❌ Lesson load error:', err);
    } finally {
      this.loading = false;
    }
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
  },
  methods: {
    toggleAiChat() {
      this.showAiChat = !this.showAiChat;
      if (this.showAiChat) this.fetchAiExplanation();
    },
    async fetchAiExplanation() {
      try {
        const res = await axios.post(`${BASE_URL}/chat/ask`, {
          message: `Explain this lesson with ID: ${this.lessonId}`
        });
        this.aiExplanation = res.data.reply || '⚠️ AI не дал ответ';
      } catch (err) {
        this.aiExplanation = '❌ Ошибка AI сервиса';
      }
    },
    startLesson() {
      this.started = true;
      this.startTime = Date.now();
      this.timerInterval = setInterval(() => this.$forceUpdate(), 1000);
    },
    confirmUnderstanding() {
      this.understood = true;
    },
    submitAnswer() {
      const correct = this.currentExercise.answer?.toLowerCase();
      const answer = this.userAnswer.trim().toLowerCase();
      if (!answer) return this.confirmation = '⚠️ Введите ответ';
      if (answer === correct) {
        this.confirmation = '✅ Верно!';
        this.attemptCount = 0;
      } else {
        this.attemptCount++;
        this.mistakeCount++;
        if (this.attemptCount === 1)
          this.confirmation = '❌ Подсказка: ' + (this.currentExercise.hint1 || 'Попробуйте ещё');
        else if (this.attemptCount === 2)
          this.confirmation = '❌ Подсказка: ' + (this.currentExercise.hint2 || 'Подумайте внимательно');
        else
          this.confirmation = '❌ Обратитесь к AI-помощнику.';
      }
    },
    goNext() {
      this.confirmation = '';
      this.understood = false;
      this.userAnswer = '';
      this.attemptCount = 0;
      if (this.currentStep < this.exerciseSteps) this.currentStep++;
      else this.completeLesson();
    },
    async completeLesson() {
      this.lessonCompleted = true;
      this.showConfetti = true;
      setTimeout(() => this.launchConfetti(), 200);
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      const token = await auth.currentUser?.getIdToken();
      this.medalImage = this.mistakeCount === 0
        ? '/images/medals/gold.png'
        : this.mistakeCount <= 2
        ? '/images/medals/silver.png'
        : '/images/medals/bronze.png';
      await axios.post(`${BASE_URL}/users/${this.userId}/diary`, {
        lessonName: this.lesson.lessonName,
        duration,
        date: new Date().toISOString(),
        mistakes: this.mistakeCount
      }, { headers: { Authorization: `Bearer ${token}` }});
      await axios.post(`${BASE_URL}/users/${this.userId}/analytics`, {
        subject: this.lesson.subject,
        topic: this.lesson.topic,
        timeSpent: duration,
        mistakes: this.mistakeCount,
        completed: true
      }, { headers: { Authorization: `Bearer ${token}` }});
    },
    launchConfetti() {
      const canvas = this.$refs.confettiCanvas;
      const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
      myConfetti({ particleCount: 150, spread: 160, origin: { y: 0.6 } });
      setTimeout(() => (this.showConfetti = false), 5000);
    },
    confirmExit() {
      this.showExitModal = true;
    },
    cancelExit() {
      this.showExitModal = false;
    },
    exitLesson() {
      this.showExitModal = false;
      this.$router.push('/profile');
    }
  }
};
</script>

<style scoped>
@import '@/assets/css/LessonPage.css';

.ai-help-btn {
  position: fixed;
  bottom: 22px;
  right: 22px;
  background: #8b5cf6;
  color: white;
  border: none;
  font-size: 1.2rem;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 9998;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ai-help-btn:hover {
  background: #7c3aed;
}

.ai-chat-modal {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 340px;
  background: white;
  border: 2px solid #c4b5fd;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
}
.ai-chat-header {
  background: #ede9fe;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #4c1d95;
  border-bottom: 1px solid #ddd6fe;
}
.ai-chat-body {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.95rem;
}
.chat-message {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 10px;
}
.chat-message.ai {
  background: #f3e8ff;
  color: #4c1d95;
}
.chat-message.user {
  background: #dbeafe;
  color: #1e3a8a;
  text-align: right;
}
.ai-close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #6b21a8;
  cursor: pointer;
}
</style>
