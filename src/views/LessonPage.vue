<template>
  <div class="lesson-page">
    <div v-if="showPaywallModal" class="modal">
      <div class="modal-content">
        <h3>🔒 Платный контент</h3>
        <p>Этот урок доступен только для подписчиков.</p>
        <button @click="$router.push('/pay/start')">💳 Перейти к подписке</button>
        <button @click="$router.push('/catalogue')">⬅️ Назад к каталогу</button>
      </div>
    </div>

    <div v-if="!started && !showPaywallModal" class="intro-screen">
      <button class="exit-btn" @click="confirmExit">❌</button>
      <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) || 'Без названия' }}</h2>
      <p>⏱️ Время прохождения: ~10 минут</p>
      <p>📌 Что вы узнаете: {{ getLocalized(lesson.description) || 'описание недоступно' }}</p>
      <button class="start-btn" @click="startLesson">Начать урок</button>
    </div>

    <div v-else-if="!showPaywallModal" class="lesson-split">
      <!-- Left Panel: Explanation / Theory -->
      <div class="lesson-left">
        <div class="lesson-header">
          <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
          <div class="timer-display">⏱ {{ formattedTime }}</div>
        </div>

        <div class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          <span class="progress-label">Прогресс: {{ currentPhaseIndex + 1 }} / {{ allPhases.length }}</span>
        </div>

        <div v-if="!lessonCompleted">
          <div v-if="currentPhase.type === 'explanation'">
            <h3>📚 Объяснение</h3>
            <p class="explanation-text">{{ currentPhase.data }}</p>
            <p class="example-text">{{ lesson.examples }}</p>
            <div class="navigation-area">
              <button class="nav-btn" @click="goNext">➡️ Далее</button>
            </div>
          </div>

          <div v-else class="locked-overlay">
            📌 Практическая часть справа ⮕
          </div>
        </div>

        <div v-else class="congrats-section">
          <h3>🏆 Урок завершён!</h3>
          <img :src="medalImage" alt="Медаль" class="medal-image" />
        </div>
      </div>

      <!-- Right Panel: Practical -->
      <div class="lesson-right" v-if="!lessonCompleted">
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
          <button class="submit-btn" @click="submitAnswer">Проверить</button>
          <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
          <p v-if="mistakeCount >= 3 && currentPhase.data.hint" class="hint">💡 Подсказка: {{ currentPhase.data.hint }}</p>
        </div>

        <div v-else-if="currentPhase.type === 'quiz'">
          <h3>🎮 Финальный тест</h3>
          <p class="exercise-question">{{ currentPhase.data.question }}</p>
          <div v-for="(opt, j) in currentPhase.data.options" :key="j">
            <label>
              <input type="radio" :value="opt" v-model="userAnswer" /> {{ opt }}
            </label>
          </div>
          <button class="submit-btn" @click="submitAnswer">Ответить</button>
          <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
        </div>

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
      medalImage: ''
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser']),
    allPhases() {
      const phases = [];
      if (Array.isArray(this.lesson.explanations)) {
        this.lesson.explanations.forEach((ex) => phases.push({ type: 'explanation', data: ex }));
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
          quiz: data.quiz || []
        };
      } catch (err) {
        console.error('❌ Ошибка загрузки урока:', err);
      }
    },
    startLesson() {
      this.started = true;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
    },
    submitAnswer() {
      const phase = this.currentPhase;
      const correct = (phase.data.correctAnswer || phase.data.answer || '').toLowerCase();
      const answer = this.userAnswer.trim().toLowerCase();
      if (!answer) return (this.confirmation = '⚠️ Введите ответ.');

      if (answer === correct) {
        this.confirmation = '✅ Верно!';
      } else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
      }
    },
    goNext() {
      this.userAnswer = '';
      this.confirmation = '';
      this.mistakeCount = 0;

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
      this.medalImage =
        this.mistakeCount === 0
          ? '/images/medals/gold.png'
          : this.mistakeCount <= 2
          ? '/images/medals/silver.png'
          : '/images/medals/bronze.png';

      try {
        await axios.post(`${BASE_URL}/users/${this.userId}/diary`, {
          lessonName: this.getLocalized(this.lesson.lessonName),
          duration,
          date: new Date().toISOString(),
          mistakes: this.mistakeCount
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await axios.post(`${BASE_URL}/users/${this.userId}/analytics`, {
          subject: this.lesson.subject,
          topic: this.lesson.topic,
          timeSpent: duration,
          mistakes: this.mistakeCount,
          completed: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
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


<style scoped>
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
