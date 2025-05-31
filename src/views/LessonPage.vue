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
        <p>Ваш прогресс будет сохранён автоматически.</p>
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
      
      <!-- Show previous progress if exists -->
      <div v-if="previousProgress && previousProgress.completedSteps.length > 0" class="previous-progress">
        <p>📈 Предыдущий прогресс: {{ previousProgress.completedSteps.length }}/{{ steps.length }} шагов</p>
        <p>⭐ Звезды: {{ previousProgress.stars || 0 }}</p>
        <p>⚠️ Ошибки: {{ previousProgress.mistakes || 0 }}</p>
        <button @click="continuePreviousProgress" class="continue-btn">📖 Продолжить с места остановки</button>
      </div>
      
      <button class="start-btn" @click="startLesson">{{ previousProgress ? 'Начать заново' : 'Начать урок' }}</button>
    </div>

    <!-- Lesson Content -->
    <div v-else-if="!showPaywallModal" :class="lessonCompleted ? 'lesson-complete-wrapper' : 'lesson-split'">
      <div :class="lessonCompleted ? 'lesson-complete-full' : 'lesson-left'">
        <!-- Header -->
        <div v-if="!lessonCompleted" class="lesson-header">
          <button class="exit-btn-small" @click="confirmExit">❌</button>
          <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
          <div class="timer-display">⏱ {{ formattedTime }}</div>
        </div>

        <!-- Progress Bar -->
        <div v-if="!lessonCompleted" class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          <span class="progress-label">Прогресс: {{ currentIndex + 1 }} / {{ steps.length }} ({{ progressPercentage }}%)</span>
          <span class="stars-display">⭐ {{ stars }}</span>
        </div>

        <!-- LEFT SIDE: Single step only -->
        <div v-if="!lessonCompleted && currentStep">
          <!-- Explanation or Example -->
          <div v-if="['explanation', 'example'].includes(currentStep.type)">
            <h3 v-if="currentStep.type === 'explanation'">📚 Объяснение</h3>
            <h3 v-else>💡 Пример</h3>
            <p class="explanation-text">{{ getLocalized(currentStep.data) }}</p>
            <div class="navigation-area">
              <button v-if="currentIndex > 0" class="nav-btn prev-btn" @click="goPrevious">⬅️ Назад</button>
              <button class="nav-btn" @click="goNext">➡️ Далее</button>
            </div>
          </div>

          <!-- Lock left side during interactive step -->
          <div v-else-if="['exercise', 'tryout', 'quiz'].includes(currentStep.type)">
            <div class="locked-overlay">📌 Практическая часть справа ⮕</div>
            <div v-if="currentIndex > 0" class="navigation-area">
              <button class="nav-btn prev-btn" @click="goPrevious">⬅️ Назад</button>
            </div>
          </div>

          <!-- Fallback unknown step -->
          <div v-else>
            <div class="locked-overlay">❗ Неизвестный тип шага: {{ currentStep.type }}</div>
          </div>
        </div>

        <!-- Completion block -->
        <div v-else class="completion-content">
          <h3 class="lesson-complete-title">🏆 Урок завершён!</h3>
          <img :src="medalImage" alt="Медаль" class="medal-image" />
          <p class="medal-label">{{ medalLabel }}</p>
          <p class="completion-time">⏱ Вы прошли урок за {{ readableTime }}</p>
          <p class="completion-motivation">🚀 Великолепно! Вы делаете прогресс, не останавливайтесь!</p>
          <p class="completion-stats">
            ⭐ Звезды: {{ stars }} | 
            ❌ Ошибки: {{ mistakeCount }} | 
            🎯 Очки: {{ earnedPoints }}
          </p>
          <div class="completion-buttons">
            <button class="return-btn" @click="$router.push('/catalogue')">⬅️ Вернуться в каталог</button>
            <button class="share-btn" @click="shareResult">📤 Поделиться успехом</button>
            <button class="homework-btn" @click="goToHomework">➡️ К домашке</button>
          </div>

          <!-- Mistake review -->
          <div v-if="mistakeLog?.length" class="mistake-review">
            <h4>🛠 Ошибки для повторения</h4>
            <ul>
              <li v-for="(entry, idx) in mistakeLog" :key="idx">
                ❌ <strong>Вопрос:</strong> {{ entry.question }}<br />
                <strong>Ваш ответ:</strong> {{ entry.userAnswer }}<br />
                <strong>Правильный ответ:</strong> {{ entry.correctAnswer }}<br />
                <span v-if="entry.hint"><strong>Подсказка:</strong> {{ entry.hint }}</span><br />
                <button @click="retryStep(entry.stepIndex)">🔁 Повторить</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDE: Only for interactive steps -->
      <div class="lesson-right" v-if="!lessonCompleted && ['exercise', 'tryout', 'quiz'].includes(currentStep?.type)">
        <!-- Tryout / Exercise -->
        <div v-if="['exercise', 'tryout'].includes(currentStep.type)">
          <h3>✏️ {{ currentStep.type === 'tryout' ? 'Попробуйте' : 'Упражнение' }}</h3>
          <p class="exercise-question">{{ getLocalized(currentStep.data.question) }}</p>
          
          <!-- Multiple choice options -->
          <div v-if="Array.isArray(currentStep.data.options) && currentStep.data.options.length" class="options-container">
            <label v-for="(opt, j) in currentStep.data.options" :key="j" class="option-label">
              <input type="radio" :value="opt" v-model="userAnswer" class="option-radio" />
              <span class="option-text">{{ opt }}</span>
            </label>
          </div>
          
          <!-- Text input -->
          <div v-else class="text-input-container">
            <textarea 
              v-model="userAnswer" 
              placeholder="Введите ваш ответ..."
              class="answer-textarea"
              @keyup.enter="handleSubmitOrNext"
            ></textarea>
          </div>

          <div class="action-buttons">
            <button v-if="!answerWasCorrect" class="submit-btn" @click="handleSubmitOrNext" :disabled="!userAnswer.trim()">
              🔍 Проверить
            </button>
            <button v-else class="next-btn" @click="goNext">✅ Далее</button>
          </div>

          <p v-if="confirmation" :class="['confirmation', answerWasCorrect ? 'correct' : 'incorrect']">{{ confirmation }}</p>
          <p v-if="mistakeCount >= 3 && currentStep.data.hint && !answerWasCorrect" class="hint">
            💡 Подсказка: {{ currentStep.data.hint }}
          </p>
        </div>

        <!-- Quiz -->
        <div v-else-if="currentStep.type === 'quiz'">
          <h3>🎮 Финальный тест</h3>
          <p class="exercise-question">{{ getLocalized(currentStep.data.question) }}</p>
          <div class="options-container">
            <label v-for="(opt, j) in currentStep.data.options" :key="j" class="option-label">
              <input type="radio" :value="opt" v-model="userAnswer" class="option-radio" />
              <span class="option-text">{{ opt }}</span>
            </label>
          </div>

          <div class="action-buttons">
            <button v-if="!answerWasCorrect" class="submit-btn" @click="handleSubmitOrNext" :disabled="!userAnswer.trim()">
              🎯 Ответить
            </button>
            <button v-else class="next-btn" @click="goNext">✅ Далее</button>
          </div>

          <p v-if="confirmation" :class="['confirmation', answerWasCorrect ? 'correct' : 'incorrect']">{{ confirmation }}</p>
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
      mistakeLog: [],
      previousProgress: null,
      earnedPoints: 0,
      hintsUsed: false
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser']),
    currentStep() {
      return this.steps[this.currentIndex] || null;
    },
    progressPercentage() {
      if (this.steps.length === 0) return 0;
      const completed = Math.min(this.currentIndex + 1, this.steps.length);
      return Math.floor((completed / this.steps.length) * 100);
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
    await this.loadPreviousProgress();
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
    clearInterval(this.autosaveTimer);
    // Save progress before leaving
    if (this.started && !this.lessonCompleted) {
      this.saveProgress(false);
    }
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
          // Legacy format support
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
        this.$router.push('/catalogue');
      }
    },

    async loadPreviousProgress() {
      if (!this.lesson._id) return;
      
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.warn('⚠️ No auth token available for loading progress');
          return;
        }

        const { data } = await axios.get(`${BASE_URL}/user/${this.userId}/lesson/${this.lesson._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data && data.completedSteps && data.completedSteps.length > 0) {
          this.previousProgress = data;
        }
      } catch (err) {
        console.warn('⚠️ Не удалось загрузить предыдущий прогресс:', err);
      }
    },

    continuePreviousProgress() {
      if (this.previousProgress) {
        // Ensure currentIndex doesn't exceed steps length
        this.currentIndex = Math.min(
          this.previousProgress.completedSteps.length, 
          this.steps.length - 1
        );
        this.stars = parseInt(this.previousProgress.stars) || 0;
        this.mistakeCount = parseInt(this.previousProgress.mistakes) || 0;
        this.elapsedSeconds = parseInt(this.previousProgress.durationSeconds) || 0;
        this.hintsUsed = Boolean(this.previousProgress.usedHints);
        this.earnedPoints = parseInt(this.previousProgress.pointsEarned) || 0;
      }
      this.startLesson();
    },

    startLesson() {
      this.started = true;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
      this.autosaveTimer = setInterval(() => this.autosaveProgress(), 15000);
    },

    async autosaveProgress() {
      await this.saveProgress(false);
    },

    async saveProgress(completed = false) {
      try {
        // Validate required data before making request
        if (!this.userId) {
          console.error('❌ No userId available');
          return;
        }
        
        if (!this.lesson._id) {
          console.error('❌ No lesson ID available');
          return;
        }

        // Get authentication token with better error handling
        let token;
        try {
          if (!auth.currentUser) {
            console.error('❌ No authenticated user');
            return;
          }
          token = await auth.currentUser.getIdToken();
        } catch (authError) {
          console.error('❌ Failed to get auth token:', authError);
          return;
        }

        // Build completed steps array more safely
        const completedSteps = [];
        if (this.started) {
          const maxIndex = Math.min(this.currentIndex, this.steps.length - 1);
          for (let i = 0; i <= maxIndex; i++) {
            completedSteps.push(i);
          }
        }

        // Calculate progress percentage more safely
        const progressPercent = this.steps.length > 0 
          ? Math.floor((completedSteps.length / this.steps.length) * 100) 
          : 0;

        // Ensure topicId is valid - use lesson._id as fallback
        let topicId = this.lesson._id;
        if (this.lesson.topic && this.lesson.topic !== null && this.lesson.topic !== undefined) {
          topicId = this.lesson.topic;
        }

        // Ensure all numeric values are valid
        const progressData = {
          userId: String(this.userId),
          lessonId: String(this.lesson._id),
          topicId: String(topicId),
          completedSteps: completedSteps,
          percent: Math.max(0, Math.min(100, progressPercent)),
          stars: Math.max(0, parseInt(this.stars) || 0),
          pointsEarned: Math.max(0, parseInt(this.earnedPoints) || 0),
          mistakes: Math.max(0, parseInt(this.mistakeCount) || 0),
          durationSeconds: Math.max(0, parseInt(this.elapsedSeconds) || 0),
          usedHints: Boolean(this.hintsUsed),
          submittedHomework: false
        };

        // Add completion data if completed
        if (completed) {
          progressData.completedAt = new Date().toISOString();
          progressData.completed = true;
        }

        console.log('📤 Saving progress data:', progressData);

        const response = await axios.post(`${BASE_URL}/progress`, progressData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('✅ Progress saved successfully:', response.data);
        
      } catch (err) {
        console.error('❌ Ошибка сохранения прогресса:', err);
        
        // Log more detailed error information
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          console.error('Response headers:', err.response.headers);
        } else if (err.request) {
          console.error('Request was made but no response received:', err.request);
        } else {
          console.error('Error setting up request:', err.message);
        }
      }
    },

    handleSubmitOrNext() {
      const step = this.currentStep;
      const correctAnswer = (step.data.correctAnswer || step.data.answer || '').toLowerCase().trim();
      const userResponse = this.userAnswer.trim().toLowerCase();

      if (!userResponse) {
        this.confirmation = '⚠️ Введите ответ.';
        return;
      }

      if (userResponse === correctAnswer) {
        this.confirmation = '✅ Верно! Отличная работа!';
        this.answerWasCorrect = true;
        this.stars++;
        this.earnedPoints += 10;
      } else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
        this.answerWasCorrect = false;
        this.earnedPoints = Math.max(0, this.earnedPoints - 2);

        // Log mistake for review
        this.mistakeLog.push({
          stepIndex: this.currentIndex,
          question: this.getLocalized(step.data.question),
          userAnswer: this.userAnswer,
          correctAnswer: step.data.correctAnswer || step.data.answer,
          hint: step.data.hint || null
        });

        // Show hint after 3 mistakes
        if (this.mistakeCount >= 3 && step.data.hint) {
          this.hintsUsed = true;
        }
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

    goPrevious() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.userAnswer = '';
        this.confirmation = '';
        this.answerWasCorrect = false;
      }
    },

    retryStep(index) {
      this.lessonCompleted = false;
      this.showConfetti = false;
      this.started = true;
      this.currentIndex = Math.max(0, Math.min(index, this.steps.length - 1));
      this.userAnswer = '';
      this.confirmation = '';
      this.answerWasCorrect = false;
      
      // Restart timer if needed
      if (!this.timerInterval) {
        this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
        this.autosaveTimer = setInterval(() => this.autosaveProgress(), 15000);
      }
    },

    async completeLesson() {
      clearInterval(this.timerInterval);
      clearInterval(this.autosaveTimer);
      this.lessonCompleted = true;
      this.showConfetti = true;

      // Calculate final points
      this.earnedPoints = Math.max(0, 100 - this.mistakeCount * 10 + this.stars * 5);

      // Set medal based on performance
      if (this.mistakeCount === 0) {
        this.medalImage = '/images/medals/gold.png';
        this.medalLabel = '🥇 Золотая медаль - Безупречно!';
      } else if (this.mistakeCount <= 2) {
        this.medalImage = '/images/medals/silver.png';
        this.medalLabel = '🥈 Серебряная медаль - Отлично!';
      } else {
        this.medalImage = '/images/medals/bronze.png';
        this.medalLabel = '🥉 Бронзовая медаль - Хорошо!';
      }

      setTimeout(() => this.launchConfetti(), 200);

      // Save final progress
      await this.saveProgress(true);

      // Save to diary and analytics
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.warn('⚠️ No auth token for analytics');
          return;
        }

        // Save to diary
        await axios.post(`${BASE_URL}/users/${this.userId}/diary`, {
          lessonName: this.getLocalized(this.lesson.lessonName),
          duration: this.elapsedSeconds,
          date: new Date().toISOString(),
          mistakes: this.mistakeCount,
          stars: this.stars
        }, { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

        // Save analytics
        await axios.post(`${BASE_URL}/users/${this.userId}/analytics`, {
          subject: this.lesson.subject || 'general',
          topic: this.lesson.topic || this.lesson._id,
          timeSpent: this.elapsedSeconds,
          mistakes: this.mistakeCount,
          completed: true,
          stars: this.stars,
          points: this.earnedPoints
        }, { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
      } catch (err) {
        console.error('❌ Ошибка отправки аналитики:', err);
      }
    },

    launchConfetti() {
      const canvas = this.$refs.confettiCanvas;
      if (canvas) {
        const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
        myConfetti({ particleCount: 150, spread: 180, origin: { y: 0.6 } });
        setTimeout(() => (this.showConfetti = false), 5000);
      }
    },

    confirmExit() {
      this.showExitModal = true;
    },

    cancelExit() {
      this.showExitModal = false;
    },

    async exitLesson() {
      // Save progress before exit
      if (this.started && !this.lessonCompleted) {
        await this.saveProgress(false);
      }
      this.showExitModal = false;
      this.$router.push('/catalogue');
    },

    shareResult() {
      const message = `🎉 Я только что завершил урок "${this.getLocalized(this.lesson.lessonName)}"! Получил ${this.stars} звезд и ${this.earnedPoints} очков! 🚀`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Мой успех в обучении!',
          text: message,
          url: window.location.href
        }).catch(err => {
          console.log('Share failed:', err);
          this.fallbackShare(message);
        });
      } else {
        this.fallbackShare(message);
      }
    },

    fallbackShare(message) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message).then(() => {
          alert('📋 Результат скопирован в буфер обмена!');
        }).catch(() => {
          alert('📤 ' + message);
        });
      } else {
        alert('📤 ' + message);
      }
    }
  }
};
</script>





<style>
@import '@/assets/css/LessonPage.css';
@import '@/assets/css/LessonPage.css';

/* Enhanced Floating Robot */
.floating-robot {
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 150px;
  height: 150px;
  z-index: 100;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease, filter 0.3s ease;
  animation: gentle-float 3s ease-in-out infinite;
}

.floating-robot:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.15));
}

@keyframes gentle-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

/* Enhanced AI Help Button */
.ai-help-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  padding: 14px 20px;
  border-radius: 16px;
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 9998;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.ai-help-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.ai-help-btn:hover::before {
  left: 100%;
}

.ai-help-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 12px 32px rgba(102, 126, 234, 0.5),
    0 8px 16px rgba(0, 0, 0, 0.15);
}

.ai-help-btn:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s ease;
}

/* Enhanced AI Chat Modal */
.ai-chat-modal {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 380px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 520px;
  animation: modal-slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom right;
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Enhanced Chat Header */
.ai-chat-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #1e293b;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  font-size: 1rem;
  position: relative;
}

.ai-chat-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.3), transparent);
}

/* Enhanced Chat Body */
.ai-chat-body {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
  font-size: 0.9rem;
  background: linear-gradient(180deg, #fafafa 0%, #f1f5f9 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-chat-body::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.ai-chat-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}

.ai-chat-body::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}

/* Enhanced Chat Messages */
.chat-message {
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.6;
  max-width: 85%;
  position: relative;
  word-wrap: break-word;
  animation: message-appear 0.3s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message.ai {
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  color: #3730a3;
  align-self: flex-start;
  border: 1px solid rgba(99, 102, 241, 0.1);
  margin-right: auto;
}

.chat-message.ai::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #f0f4ff;
}

.chat-message.user {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  align-self: flex-end;
  border: 1px solid rgba(59, 130, 246, 0.1);
  margin-left: auto;
}

.chat-message.user::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid #dbeafe;
}

/* Enhanced Close Button */
.ai-close-btn {
  background: rgba(148, 163, 184, 0.1);
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.ai-close-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ai-close-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
  transform: scale(1.1);
}

.ai-close-btn:hover::before {
  opacity: 1;
}

.ai-close-btn:active {
  transform: scale(0.95);
}

/* Enhanced Responsive Design */
@media (max-width: 768px) {
  .ai-chat-modal {
    width: calc(100vw - 32px);
    right: 16px;
    left: 16px;
    bottom: 90px;
    max-height: 60vh;
  }
  
  .floating-robot {
    width: 120px;
    height: 120px;
    bottom: 16px;
    left: 16px;
  }
  
  .ai-help-btn {
    bottom: 16px;
    right: 16px;
    padding: 12px 16px;
    font-size: 0.9rem;
  }
  
  .chat-message {
    max-width: 95%;
    padding: 10px 14px;
  }
}

@media (max-width: 480px) {
  .ai-chat-modal {
    max-height: 50vh;
  }
  
  .ai-chat-header {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
  
  .ai-chat-body {
    padding: 16px;
  }
}

/* Accessibility Enhancements */
@media (prefers-reduced-motion: reduce) {
  .floating-robot,
  .ai-help-btn,
  .chat-message,
  .ai-close-btn {
    animation: none;
    transition: none;
  }
  
  .gentle-float {
    animation: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .ai-chat-modal {
    border: 2px solid #000;
    background: #fff;
  }
  
  .chat-message.ai {
    background: #f0f0f0;
    color: #000;
    border: 1px solid #000;
  }
  
  .chat-message.user {
    background: #e0e0e0;
    color: #000;
    border: 1px solid #000;
  }
}

/* Focus States for Accessibility */
.ai-help-btn:focus,
.ai-close-btn:focus {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

/* Loading State */
.chat-message.loading {
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
