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
      <div class="lesson-left">
        <div class="lesson-header">
          <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
          <div class="timer-display">⏱ {{ formattedTime }}</div>
        </div>

        <div v-if="!lessonCompleted">
          <div class="section explanation-block">
            <h3>📚 Объяснение</h3>
            <div v-html="getLocalized(lesson.explanation) || 'Нет объяснения'" class="explanation-text"></div>
          </div>

          <div class="section example-block">
            <h3>💗 Примеры</h3>
            <div v-html="getLocalized(lesson.examples) || 'Нет примеров'" class="example-text"></div>
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
          <template v-if="Array.isArray(currentExercise.options)">
            <p class="exercise-question">{{ currentExercise.question || 'Вопрос отсутствует' }}</p>
            <div class="exercise-options">
              <label v-for="(opt, i) in currentExercise.options" :key="i">
                <input type="radio" :value="opt.option || opt" v-model="userAnswer" /> {{ opt.option || opt }}
              </label>
            </div>
          </template>
          <template v-else>
            <p class="exercise-question">{{ currentExercise.question || 'Вопрос отсутствует' }}</p>
            <textarea v-model="userAnswer" placeholder="Введите ваш ответ..."></textarea>
          </template>
          <button class="submit-btn" @click="submitAnswer">Готово</button>
          <div v-if="confirmation" class="confirmation">{{ confirmation }}</div>
          <div v-if="mistakeCount >= 3 && currentExercise.hint" class="hint-box">💡 Подсказка: {{ currentExercise.hint }}</div>
        </div>
        <div v-else-if="!understood">
          <div class="locked-overlay">⛔️ Заблокировано до нажатия "Понял"</div>
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
      userAnswer: '',
      confirmation: '',
      currentStep: 0,
      started: false,
      elapsedSeconds: 0,
      timerInterval: null,
      understood: false,
      showExitModal: false,
      mistakeCount: 0,
      lessonCompleted: false,
      showConfetti: false,
      medalImage: '',
      userId: null,
      showPaywallModal: false,
      userStatus: 'free'
    };
  },
  computed: {
    exerciseSteps() {
      const exCount = Array.isArray(this.lesson.exercises) ? this.lesson.exercises.length : 0;
      const abcCount = Array.isArray(this.lesson.abcExercises) ? this.lesson.abcExercises.length : 0;
      return 2 + exCount + abcCount;
    },
    currentExercise() {
      const index = this.currentStep - 2;
      const exLength = this.lesson.exercises?.length || 0;
      if (index < 0) return {};
      if (index < exLength) return this.lesson.exercises[index];
      const abcIndex = index - exLength;
      return this.lesson.abcExercises?.[abcIndex] || {};
    },
    formattedTime() {
      const minutes = Math.floor(this.elapsedSeconds / 60);
      const seconds = this.elapsedSeconds % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    canProceed() {
      return this.understood && this.confirmation.includes('✅');
    }
  },
  async mounted() {
    this.userId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!this.userId) return this.$router.push('/');

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`${BASE_URL}/users/${this.userId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.userStatus = res.data.status || 'free';
    } catch (err) {
      console.warn('⚠️ Не удалось получить статус пользователя. По умолчанию: free');
    }

    await this.loadLesson();
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
  },
  methods: {
    getLocalized(field) {
      return field?.[this.$i18n?.locale || 'en'] || field?.en || (typeof field === 'string' ? field : '');
    },
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        const { data } = await axios.get(`${BASE_URL}/lessons/${lessonId}`);
        if (!data || !data._id) return this.$router.push('/catalogue');
        if (data.type === 'premium' && this.userStatus === 'free') {
          this.showPaywallModal = true;
          return;
        }
        if (!Array.isArray(data.exercises)) data.exercises = [];
        if (!Array.isArray(data.abcExercises)) data.abcExercises = [];
        this.lesson = data;
      } catch (err) {
        console.error('Ошибка загрузки урока:', err);
      }
    },
    startLesson() {
      if (this.lesson.type === 'premium' && this.userStatus === 'free') {
        this.showPaywallModal = true;
        return;
      }
      this.started = true;
      this.elapsedSeconds = 0;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
    },
    confirmUnderstanding() {
      this.understood = true;
    },
    submitAnswer() {
      const correct = this.currentExercise.correctAnswer?.toLowerCase() || this.currentExercise.answer?.toLowerCase();
      const answer = this.userAnswer.trim().toLowerCase();
      if (!answer) return this.confirmation = '⚠️ Пожалуйста, введите ответ.';
      if (answer === correct) this.confirmation = '✅ Верно!';
      else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
      }
    },
    goNext() {
      this.confirmation = '';
      this.understood = false;
      this.userAnswer = '';
      if (this.currentStep < this.exerciseSteps) {
        this.mistakeCount = 0;
        this.currentStep++;
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
      this.medalImage = this.mistakeCount === 0
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
