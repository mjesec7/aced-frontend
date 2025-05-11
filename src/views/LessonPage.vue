<template>
  <div class="lesson-page">
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
      allLessons: [],
      loading: true,
      userAnswer: '',
      confirmation: '',
      currentStep: 0,
      started: false,
      startTime: null,
      timerInterval: null,
      understood: false,
      showExitModal: false,
      completedLessons: new Set(),
      mistakeCount: 0,
      lessonCompleted: false,
      showConfetti: false,
      medalImage: '',
      userId: null,
    };
  },
  computed: {
    exerciseSteps() {
      return 2 + (this.lesson.exercises?.length || 0);
    },
    currentExercise() {
      const index = this.currentStep - 2;
      if (index < 0 || !Array.isArray(this.lesson.exercises)) return {};
      return this.lesson.exercises[index] || {};
    },
    formattedTime() {
      if (!this.startTime) return '0:00';
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    canProceed() {
      return this.understood && this.confirmation.includes('✅');
    }
  },
  async mounted() {
    await this.loadLesson();
    const storedId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    this.userId = storedId;
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
  },
  methods: {
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        const { data: lessonData } = await axios.get(`${BASE_URL}/lessons/${lessonId}`);
        this.lesson = lessonData;
        console.log('📥 Loaded full lesson object:', this.lesson);
        if (this.lesson.topicId) {
          const { data: topicLessons } = await axios.get(`${BASE_URL}/lessons/topic/${this.lesson.topicId}`);
          this.allLessons = Array.isArray(topicLessons) ? topicLessons : [];
        }
      } catch (error) {
        console.error('Ошибка загрузки урока:', error);
      } finally {
        this.loading = false;
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
      const correct = this.currentExercise.correctAnswer?.toLowerCase();
      const answer = this.userAnswer.trim().toLowerCase();
      if (!answer) {
        this.confirmation = '⚠️ Пожалуйста, введите ответ.';
        return;
      }
      if (answer === correct) {
        this.confirmation = '✅ Верно!';
      } else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
      }
    },
    goNext() {
      this.confirmation = '';
      this.understood = false;
      this.userAnswer = '';
      if (this.currentStep < this.exerciseSteps) {
        this.currentStep++;
      } else {
        this.completeLesson();
      }
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

<style>
@import '@/assets/css/LessonPage.css';
</style>
