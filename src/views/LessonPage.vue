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
      <!-- Left Panel / Full Panel -->
      <div :class="lessonCompleted ? 'lesson-complete-full' : 'lesson-left'">
        <div v-if="!lessonCompleted" class="lesson-header">
          <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
          <div class="timer-display">⏱ {{ formattedTime }}</div>
        </div>

        <div v-if="!lessonCompleted" class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          <span class="progress-label">Прогресс: {{ currentPhaseIndex + 1 }} / {{ allPhases.length }}</span>
        </div>

        <div v-if="!lessonCompleted">
          <div v-if="currentPhase.type === 'explanation'">
            <h3>📚 Объяснение</h3>
            <p class="explanation-text">{{ currentPhase.data }}</p>
            <div v-if="Array.isArray(lesson.examples) && lesson.examples.length">
              <div class="example-text" v-for="(ex, i) in lesson.examples" :key="i">🔹 {{ ex }}</div>
            </div>
            <div class="navigation-area">
              <button class="nav-btn" @click="goNext">➡️ Далее</button>
            </div>
          </div>
          <div v-else class="locked-overlay">
            📌 Практическая часть справа ⮕
          </div>
        </div>

        <!-- ✅ Lesson Completion Result -->
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
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="lesson-right" v-if="!lessonCompleted">
        <!-- Exercise Phase -->
        <div v-if="currentPhase.type === 'exercise'">
          <h3>✏️ Упражнение</h3>
          <p class="exercise-question">{{ currentPhase.data.question }}</p>
          <div v-if="Array.isArray(currentPhase.data.options) && currentPhase.data.options.length">
            <label v-for="(opt, j) in currentPhase.data.options" :key="j">
              <input type="radio" :value="opt" v-model="userAnswer" /> {{ opt }}
            </label>
          </div>
          <div v-else>
            <textarea v-model="userAnswer" placeholder="Введите ваш ответ..."></textarea>
          </div>

          <button v-if="!answerWasCorrect" class="submit-btn" @click="handleSubmitOrNext">Проверить / Далее</button>
          <button v-else class="next-btn" @click="goNext">✅ Далее</button>

          <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
          <p v-if="mistakeCount >= 3 && currentPhase.data.hint" class="hint">💡 Подсказка: {{ currentPhase.data.hint }}</p>
        </div>

        <!-- Quiz Phase -->
        <div v-else-if="currentPhase.type === 'quiz'">
          <h3>🎮 Финальный тест</h3>
          <p class="exercise-question">{{ currentPhase.data.question }}</p>
          <div v-for="(opt, j) in currentPhase.data.options" :key="j">
            <label>
              <input type="radio" :value="opt" v-model="userAnswer" /> {{ opt }}
            </label>
          </div>

          <button v-if="!answerWasCorrect" class="submit-btn" @click="handleSubmitOrNext">Ответить / Далее</button>
          <button v-else class="next-btn" @click="goNext">✅ Далее</button>

          <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
        </div>

        <!-- Other Phase -->
        <div v-else>
          <h3>⌛ Ожидание действия слева...</h3>
        </div>
      </div>
    </div>

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
      started: false,
      currentPhaseIndex: 0,
      userAnswer: '',
      confirmation: '',
      mistakeCount: 0,
      lessonCompleted: false,
      showConfetti: false,
      showExitModal: false,
      showPaywallModal: false,
      elapsedSeconds: 0,
      timerInterval: null,
      userId: null,
      medalImage: '',
      medalLabel: '',
      answerWasCorrect: false
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser']),
    allPhases() {
      const phases = [];

      if (Array.isArray(this.lesson.explanations)) {
        this.lesson.explanations.forEach((ex) =>
          phases.push({ type: 'explanation', data: ex })
        );
      }

      if (Array.isArray(this.lesson.exerciseGroups)) {
        this.lesson.exerciseGroups.forEach((group) => {
          group.exercises.forEach((ex) =>
            phases.push({ type: 'exercise', data: ex })
          );
        });
      }

      if (Array.isArray(this.lesson.quiz)) {
        this.lesson.quiz.forEach((quiz) =>
          phases.push({ type: 'quiz', data: quiz })
        );
      }

      return phases;
    },
    currentPhase() {
      return this.allPhases[this.currentPhaseIndex] || null;
    },
    progressPercentage() {
      return Math.floor((this.currentPhaseIndex / this.allPhases.length) * 100);
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
  },
  methods: {
    getLocalized(field) {
      return typeof field === 'string' ? field : (field?.en || '');
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

        this.lesson = {
          ...data,
          explanations: data.explanations || [],
          exerciseGroups: data.exerciseGroups || [],
          quiz: data.quiz || [],
          examples: Array.isArray(data.examples)
            ? data.examples
            : data.examples
            ? [data.examples]
            : []
        };
      } catch (err) {
        console.error('❌ Ошибка загрузки урока:', err);
      }
    },
    startLesson() {
      this.started = true;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
    },
    handleSubmitOrNext() {
      const phase = this.currentPhase;
      const correctAnswer = (phase.data.correctAnswer || phase.data.answer || '').toLowerCase();
      const userResponse = this.userAnswer.trim().toLowerCase();

      if (!userResponse) {
        this.confirmation = '⚠️ Введите ответ.';
        return;
      }

      if (userResponse === correctAnswer) {
        this.confirmation = '✅ Верно!';
        this.answerWasCorrect = true;
      } else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
        this.answerWasCorrect = false;
      }
    },
    goNext() {
      this.userAnswer = '';
      this.confirmation = '';
      this.mistakeCount = 0;
      this.answerWasCorrect = false;

      if (this.currentPhaseIndex + 1 < this.allPhases.length) {
        this.currentPhaseIndex++;
      } else {
        this.completeLesson();
      }
    },
    async completeLesson() {
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
        await axios.post(
          `${BASE_URL}/users/${this.userId}/diary`,
          {
            lessonName: this.getLocalized(this.lesson.lessonName),
            duration,
            date: new Date().toISOString(),
            mistakes: this.mistakeCount
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        await axios.post(
          `${BASE_URL}/users/${this.userId}/analytics`,
          {
            subject: this.lesson.subject,
            topic: this.lesson.topic,
            timeSpent: duration,
            mistakes: this.mistakeCount,
            completed: true
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
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
    }
  }
};
</script>





<style>
@import '@/assets/css/LessonPage.css';

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
