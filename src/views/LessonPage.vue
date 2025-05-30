<template>
  <div class="lesson-page">
    <!-- Paywall Modal -->
    <div v-if="showPaywallModal" class="modal">
      <div class="modal-content">
        <h3>🔒 Платный контент</h3>
        <p>Этот урок доступен только для подписчиков.</p>
        <button @click="$router.push('/pay/start')">💳 Перейти к подписке</button>
        <button @click="$router.push('/catalogue')">⬅️ Назад к каталогу</button>
      </div>
    </div>

    <!-- Exit Modal -->
    <div v-if="showExitModal" class="modal">
      <div class="modal-content">
        <h3>Вы действительно хотите выйти?</h3>
        <p>Ваш прогресс не будет сохранён.</p>
        <button @click="exitLesson">Да, выйти</button>
        <button @click="cancelExit">Нет, остаться</button>
      </div>
    </div>

    <!-- Intro Screen -->
    <div v-if="!started && !showPaywallModal" class="intro-screen">
      <button class="exit-btn" @click="confirmExit">❌</button>
      <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) || 'Без названия' }}</h2>
      <p>⏱️ Время прохождения: ~10 минут</p>
      <p>📌 Что вы узнаете: {{ getLocalized(lesson.description) || 'описание недоступно' }}</p>
      <button class="start-btn" @click="startLesson">Начать урок</button>
    </div>

    <!-- Lesson Content -->
    <div v-else-if="!showPaywallModal" :class="lessonCompleted ? 'lesson-complete-wrapper' : 'lesson-split'">
      <div :class="lessonCompleted ? 'lesson-complete-full' : 'lesson-left'">
        <!-- Header & Timer -->
        <div v-if="!lessonCompleted" class="lesson-header">
          <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
          <div class="timer-display">⏱ {{ formattedTime }}</div>
        </div>

        <!-- Progress -->
        <div v-if="!lessonCompleted" class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          <span class="progress-label">Прогресс: {{ currentIndex + 1 }} / {{ steps.length }}</span>
        </div>

        <!-- Step Display (left side) -->
        <div v-if="!lessonCompleted && currentStep">
          <div v-if="['explanation', 'example'].includes(currentStep.type)">
            <h3 v-if="currentStep.type === 'explanation'">📚 Объяснение</h3>
            <h3 v-else>💡 Пример</h3>
            <p class="explanation-text">{{ getLocalized(currentStep.data) }}</p>
            <div class="navigation-area">
              <button class="nav-btn" @click="goNext">➡️ Далее</button>
            </div>
          </div>
          <div v-else-if="['exercise', 'tryout', 'quiz'].includes(currentStep.type)">
            <div class="locked-overlay">📌 Практическая часть справа ⮕</div>
          </div>
          <div v-else>
            <div class="locked-overlay">❗ Неизвестный шаг: {{ currentStep.type }}</div>
          </div>
        </div>

        <!-- Completion -->
        <div v-else class="completion-content">
          <h3 class="lesson-complete-title">🏆 Урок завершён!</h3>
          <img :src="medalImage" alt="Медаль" class="medal-image" />
          <p class="medal-label">{{ medalLabel }}</p>
          <p class="completion-time">⏱ Вы прошли урок за {{ readableTime }}</p>
          <p class="completion-motivation">🚀 Великолепно! Вы делаете прогресс, не останавливайтесь!</p>
          <p class="completion-stats">Количество ошибок: {{ mistakeCount }}</p>
          <div class="completion-buttons">
            <button class="return-btn" @click="$router.push('/catalogue')">⬅️ Вернуться в каталог</button>
            <button class="share-btn" @click="shareResult">📤 Поделиться успехом</button>
            <button class="homework-btn" @click="goToHomework">➡️ К домашке</button>
          </div>
        </div>
      </div>

      <!-- Right Side: Exercises & Quizzes -->
      <div class="lesson-right" v-if="!lessonCompleted && ['exercise', 'tryout', 'quiz'].includes(currentStep?.type)">
        <div v-if="['exercise', 'tryout'].includes(currentStep.type)">
          <h3>✏️ Упражнение</h3>
          <p class="exercise-question">{{ getLocalized(currentStep.data.question) }}</p>
          <div v-if="Array.isArray(currentStep.data.options) && currentStep.data.options.length">
            <label v-for="(opt, j) in currentStep.data.options" :key="j">
              <input type="radio" :value="opt" v-model="userAnswer" /> {{ opt }}
            </label>
          </div>
          <div v-else>
            <textarea v-model="userAnswer" placeholder="Введите ваш ответ..."></textarea>
          </div>

          <button v-if="!answerWasCorrect" class="submit-btn" @click="handleSubmitOrNext">Проверить / Далее</button>
          <button v-else class="next-btn" @click="goNext">✅ Далее</button>

          <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
          <p v-if="mistakeCount >= 3 && currentStep.data.hint" class="hint">💡 Подсказка: {{ currentStep.data.hint }}</p>
        </div>

        <div v-else-if="currentStep.type === 'quiz'">
          <h3>🎮 Финальный тест</h3>
          <p class="exercise-question">{{ getLocalized(currentStep.data.question) }}</p>
          <div v-for="(opt, j) in currentStep.data.options" :key="j">
            <label>
              <input type="radio" :value="opt" v-model="userAnswer" /> {{ opt }}
            </label>
          </div>

          <button v-if="!answerWasCorrect" class="submit-btn" @click="handleSubmitOrNext">Ответить / Далее</button>
          <button v-else class="next-btn" @click="goNext">✅ Далее</button>

          <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
        </div>
      </div>
    </div>

    <!-- Confetti -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import axios from 'axios';
import confetti from 'canvas-confetti';
import { auth } from '@/firebase';
import { mapGetters } from 'vuex';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'LessonPage',
  data() {
    return {
      lesson: {},
      steps: [],
      currentIndex: 0,
      started: false,
      userAnswer: '',
      confirmation: '',
      mistakeCount: 0,
      answerWasCorrect: false,
      lessonCompleted: false,
      elapsedSeconds: 0,
      showConfetti: false,
      showPaywallModal: false,
      showExitModal: false,
      timerInterval: null,
      autosaveTimer: null,
      userId: null,
      medalImage: '',
      medalLabel: '',
      stars: 0,
      mistakeLog: []
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser']),
    currentStep() {
      return this.steps[this.currentIndex] || null;
    },
    progressPercentage() {
      return Math.floor((this.currentIndex / this.steps.length) * 100);
    },
    formattedTime() {
      const min = Math.floor(this.elapsedSeconds / 60);
      const sec = this.elapsedSeconds % 60;
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    },
    readableTime() {
      const min = Math.floor(this.elapsedSeconds / 60);
      const sec = this.elapsedSeconds % 60;
      return `${min} мин ${sec} сек`;
    }
  },
  async mounted() {
    this.userId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!this.userId) return this.$router.push('/');
    await this.loadLesson();
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
    clearInterval(this.autosaveTimer);
  },
  methods: {
    getLocalized(field) {
      return typeof field === 'string' ? field : (field?.en || '').replace(/^en:/i, '').trim();
    },
    goToHomework() {
      this.$router.push(`/profile/homeworks/${this.lesson._id}`);
    },
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        const { data } = await axios.get(`${BASE_URL}/lessons/${lessonId}`);

        if (!data || !data._id) return this.$router.push('/catalogue');
        if (data.type === 'premium' && !this.isPremiumUser) {
          this.showPaywallModal = true;
          return;
        }

        this.lesson = data;
        this.steps = [];

        if (Array.isArray(data.steps)) {
          data.steps.forEach(step => {
            if (['exercise', 'tryout'].includes(step.type) && Array.isArray(step.data)) {
              this.steps.push(...step.data.map(ex => ({ type: step.type, data: ex })));
            } else {
              this.steps.push(step);
            }
          });
        } else {
          if (Array.isArray(data.explanations)) {
            this.steps.push(...data.explanations.map(ex => ({ type: 'explanation', data: ex })));
          }
          if (Array.isArray(data.examples)) {
            this.steps.push(...data.examples.map(ex => ({ type: 'example', data: ex })));
          }
          if (Array.isArray(data.exerciseGroups)) {
            data.exerciseGroups.forEach(group => {
              group.exercises.forEach(ex => this.steps.push({ type: 'exercise', data: ex }));
            });
          }
          if (Array.isArray(data.quiz)) {
            this.steps.push(...data.quiz.map(q => ({ type: 'quiz', data: q })));
          }
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки урока:', err);
      }
    },
    startLesson() {
      this.started = true;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
      this.autosaveTimer = setInterval(() => this.autosaveProgress(), 15000); // autosave every 15s
    },
    async autosaveProgress() {
      try {
        const token = await auth.currentUser?.getIdToken();
        await axios.post(`${BASE_URL}/users/${this.userId}/progress`, {
          lessonId: this.lesson._id,
          currentIndex: this.currentIndex,
          elapsedSeconds: this.elapsedSeconds,
          mistakeCount: this.mistakeCount,
          stars: this.stars
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.warn('⚠️ Ошибка автосохранения:', err);
      }
    },
    handleSubmitOrNext() {
      const step = this.currentStep;
      const correctAnswer = (step.data.correctAnswer || step.data.answer || '').toLowerCase();
      const userResponse = this.userAnswer.trim().toLowerCase();

      if (!userResponse) {
        this.confirmation = '⚠️ Введите ответ.';
        return;
      }

      if (userResponse === correctAnswer) {
        this.confirmation = '✅ Верно!';
        this.answerWasCorrect = true;
        this.stars++;
      } else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
        this.answerWasCorrect = false;

        this.mistakeLog.push({
          stepIndex: this.currentIndex,
          question: step.data.question,
          userAnswer: this.userAnswer,
          correctAnswer: correctAnswer,
          hint: step.data.hint || null
        });
      }
    },
    goNext() {
      this.userAnswer = '';
      this.confirmation = '';
      this.answerWasCorrect = false;

      if (this.currentIndex + 1 < this.steps.length) {
        this.currentIndex++;
      } else {
        this.completeLesson();
      }
    },
    retryStep(index) {
      this.lessonCompleted = false;
      this.started = true;
      this.currentIndex = index;
      this.userAnswer = '';
      this.confirmation = '';
      this.answerWasCorrect = false;
    },
    async completeLesson() {
      clearInterval(this.timerInterval);
      clearInterval(this.autosaveTimer);
      this.lessonCompleted = true;
      this.showConfetti = true;
      setTimeout(() => this.launchConfetti(), 200);

      const token = await auth.currentUser?.getIdToken();
      const duration = this.elapsedSeconds;

      if (this.mistakeCount === 0) {
        this.medalImage = '/images/medals/gold.png';
        this.medalLabel = '🥇 Золотая медаль';
      } else if (this.mistakeCount <= 2) {
        this.medalImage = '/images/medals/silver.png';
        this.medalLabel = '🥈 Серебряная медаль';
      } else {
        this.medalImage = '/images/medals/bronze.png';
        this.medalLabel = '🥉 Бронзовая медаль';
      }

      try {
        await axios.post(`${BASE_URL}/users/${this.userId}/diary`, {
          lessonName: this.lesson.lessonName,
          duration,
          date: new Date().toISOString(),
          mistakes: this.mistakeCount
        }, { headers: { Authorization: `Bearer ${token}` } });

        await axios.post(`${BASE_URL}/users/${this.userId}/analytics`, {
          subject: this.lesson.subject,
          topic: this.lesson.topic,
          timeSpent: duration,
          mistakes: this.mistakeCount,
          completed: true,
          stars: this.stars,
          points: Math.max(0, 100 - this.mistakeCount * 10)
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.error('❌ Ошибка отправки аналитики:', err);
      }
    },
    launchConfetti() {
      const canvas = this.$refs.confettiCanvas;
      const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
      myConfetti({ particleCount: 150, spread: 180, origin: { y: 0.6 } });
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
    },
    shareResult() {
      alert('📤 Поделиться функцией ещё не реализована.');
    }
  }
};
</script>







<style>
@import '@/assets/css/LessonPage.css';
.floating-robot {
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 150px;
  height: 150px;
  z-index: 100;
}

.ai-help-btn {
  position: fixed;
  bottom: 22px;
  right: 22px;
  background: linear-gradient(to right, #7c3aed, #8b5cf6);
  color: #fff;
  border: none;
  font-size: 1.1rem;
  padding: 12px 18px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.3);
  z-index: 9998;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.ai-help-btn:hover {
  background: linear-gradient(to right, #6d28d9, #7c3aed);
  transform: translateY(-2px);
}

.ai-chat-modal {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 360px;
  background: #ffffff;
  border: 2px solid #c4b5fd;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 500px;
}

.ai-chat-header {
  background: #ede9fe;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #4c1d95;
  border-bottom: 1px solid #ddd6fe;
  font-size: 1.05rem;
}

.ai-chat-body {
  padding: 16px;
  flex-grow: 1;
  overflow-y: auto;
  font-size: 0.95rem;
  background: #f9fafb;
}

.chat-message {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  line-height: 1.5;
  max-width: 90%;
}

.chat-message.ai {
  background: #f3e8ff;
  color: #4c1d95;
  align-self: flex-start;
}

.chat-message.user {
  background: #dbeafe;
  color: #1e3a8a;
  text-align: right;
  align-self: flex-end;
}

.ai-close-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  color: #6b21a8;
  cursor: pointer;
  transition: color 0.2s ease;
}

.ai-close-btn:hover {
  color: #4c1d95;
}
</style>
