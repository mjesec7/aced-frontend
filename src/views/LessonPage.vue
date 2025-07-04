
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
import { mapGetters, mapState } from 'vuex';

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
    ...mapState(['user']),
    ...mapGetters(['isAuthenticated']),
    
    // ✅ FIXED: Enhanced user status checking
    userStatus() {
      // Check multiple sources for user status
      const storeStatus = this.$store.state.user?.subscriptionPlan || 
                         this.$store.getters['user/userStatus'] || 
                         this.user?.subscriptionPlan;
      
      const localStatus = localStorage.getItem('subscriptionPlan');
      
      // Prefer store status, fallback to localStorage
      const status = storeStatus || localStatus || 'free';
      
      console.log('📊 User status sources:', {
        store: storeStatus,
        localStorage: localStatus,
        final: status,
        currentUser: auth.currentUser?.email
      });
      
      return status;
    },
    
    // ✅ FIXED: More robust premium user checking
    isPremiumUser() {
      const status = this.userStatus;
      console.log('🔍 Premium access check:', {
        status,
        currentUser: auth.currentUser?.email,
        timestamp: new Date().toISOString()
      });
      
      // Check multiple sources for premium status
      const premiumStatuses = ['premium', 'start', 'pro'];
      
      // Check store status
      if (premiumStatuses.includes(status)) {
        return true;
      }
      
      // Check localStorage as fallback
      const localStatus = localStorage.getItem('subscriptionPlan');
      if (premiumStatuses.includes(localStatus)) {
        return true;
      }
      
      return false;
    },
    
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
    },
    isLastStep() {
      return this.currentIndex >= this.steps.length - 1;
    },
    userHasAccess() {
      return this.lesson.type !== 'premium' || this.isPremiumUser;
    }
  },
  async mounted() {
    console.log('🔧 LessonPage mounted');
    
    // ✅ FIXED: Better authentication waiting
    await this.waitForAuth();
    
    this.userId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!this.userId) {
      console.error('❌ No user ID found in localStorage');
      return this.$router.push('/');
    }
    
    // ✅ FIXED: Double-check authentication before loading lesson
    if (!this.isAuthenticated && !auth.currentUser) {
      console.error('❌ User not authenticated after waiting');
      return this.$router.push('/Login');
    }
    
    console.log('✅ Authentication confirmed, loading lesson...');
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
    // ✅ NEW: Wait for authentication method
    async waitForAuth() {
      console.log('⏳ Waiting for authentication...');
      
      // Check if user is already authenticated
      if (auth.currentUser) {
        console.log('✅ User already authenticated:', auth.currentUser.email);
        return;
      }
      
      // Wait for auth state to resolve
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          console.log('🔐 Auth state changed:', user ? user.email : 'No user');
          unsubscribe(); // Stop listening
          
          if (user) {
            // Update store if needed
            if (this.$store.commit) {
              try {
                this.$store.commit('user/setUser', {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName
                });
              } catch (storeError) {
                console.warn('⚠️ Could not update store:', storeError.message);
              }
            }
            console.log('✅ Authentication confirmed');
          } else {
            console.warn('⚠️ No authenticated user found');
          }
          
          resolve();
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          console.warn('⚠️ Authentication wait timeout');
          unsubscribe();
          resolve();
        }, 5000);
      });
    },

    getLocalized(field) {
      return typeof field === 'string' ? field : (field?.en || '').replace(/^en:/i, '').trim();
    },
    
    goToCatalogue() {
      this.$router.push({ name: 'CataloguePage' });
    },
    
    goToHomework() {
      this.$router.push(`/profile/homeworks/${this.lesson._id}`);
    },
    
    // ✅ FIXED: Enhanced lesson loading with better access control
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        console.log('📚 Loading lesson:', lessonId);
        
        const { data } = await axios.get(`${BASE_URL}/lessons/${lessonId}`);

        if (!data || !data._id) {
          console.error('❌ Lesson not found');
          return this.$router.push('/catalogue');
        }

        this.lesson = data;
        
        // ✅ FIXED: Enhanced access control logic
        const lessonType = data.type || 'free';
        const userHasPremium = this.isPremiumUser;
        
        console.log('🔐 Access Control Check:', {
          lessonId: data._id,
          lessonName: this.getLocalized(data.lessonName),
          lessonType: lessonType,
          userStatus: this.userStatus,
          userHasPremium: userHasPremium,
          isAuthenticated: this.isAuthenticated,
          currentUser: auth.currentUser?.email
        });
        
        // ✅ FIXED: Better access rules
        if (!auth.currentUser) {
          console.log('❌ No Firebase user - redirecting to Login');
          return this.$router.push('/Login');
        }
        
        if (lessonType === 'premium' && !userHasPremium) {
          console.log('🔒 Premium lesson, user does not have premium access');
          this.showPaywallModal = true;
          return;
        }
        
        console.log('✅ Access granted to lesson');

        // Process lesson steps
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
        
        console.log(`✅ Lesson loaded with ${this.steps.length} steps`);
        
      } catch (err) {
        console.error('❌ Error loading lesson:', err);
        if (err.response?.status === 401) {
          console.error('❌ Authentication error - redirecting to Login');
          return this.$router.push('/Login');
        }
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

        console.log(`📋 Loading previous progress for lesson: ${this.lesson._id}`);

        // ✅ FIXED: Try multiple endpoints with better error handling
        let progressData = null;
        
        // First try the user lesson endpoint
        try {
          const response = await axios.get(`${BASE_URL}/user/${this.userId}/lesson/${this.lesson._id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
            validateStatus: function (status) {
              return status < 500; // Don't throw for 404
            }
          });
          
          if (response.status === 200 && response.data && Object.keys(response.data).length > 0) {
            progressData = response.data;
            console.log('✅ Found progress at /user/lesson endpoint');
          }
        } catch (err) {
          console.log('📋 No progress at /user endpoint, trying /progress endpoint...');
        }
        
        // If no data, try the progress endpoint with query params
        if (!progressData) {
          try {
            const response = await axios.get(`${BASE_URL}/progress`, {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                userId: this.userId,
                lessonId: this.lesson._id
              },
              timeout: 10000,
              validateStatus: function (status) {
                return status < 500; // Don't throw for 404
              }
            });
            
            if (response.status === 200 && response.data) {
              // Handle different response formats
              if (response.data.data) {
                progressData = response.data.data;
              } else if (response.data.message && response.data.data === null) {
                // No progress found
                progressData = null;
              } else if (Array.isArray(response.data)) {
                // If it returns an array, find the matching lesson
                progressData = response.data.find(p => p.lessonId === this.lesson._id);
              } else {
                progressData = response.data;
              }
              
              if (progressData) {
                console.log('✅ Found progress at /progress endpoint');
              }
            }
          } catch (err) {
            console.log('📋 No progress at /progress endpoint either');
          }
        }
        
        // If still no data, try the user progress endpoint
        if (!progressData) {
          try {
            const response = await axios.get(`${BASE_URL}/users/${this.userId}/progress`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
              validateStatus: function (status) {
                return status < 500;
              }
            });
            
            if (response.status === 200 && response.data) {
              // Find progress for this specific lesson
              const allProgress = response.data.data || response.data || [];
              progressData = allProgress.find(p => 
                (p.lessonId?._id || p.lessonId) === this.lesson._id
              );
              
              if (progressData) {
                console.log('✅ Found progress at /users/progress endpoint');
              }
            }
          } catch (err) {
            console.log('📋 No progress at /users/progress endpoint');
          }
        }
        
        // If we found progress data, use it
        if (progressData && progressData.completedSteps && progressData.completedSteps.length > 0) {
          this.previousProgress = {
            _id: progressData._id,
            userId: progressData.userId,
            lessonId: progressData.lessonId,
            completedSteps: progressData.completedSteps || [],
            accuracy: progressData.accuracy || 0,
            attemptsCount: progressData.attemptsCount || 1,
            completed: progressData.completed || false,
            completedAt: progressData.completedAt,
            createdAt: progressData.createdAt,
            currentStreak: progressData.currentStreak || 0,
            duration: progressData.duration || 0,
            durationSeconds: progressData.duration || 0,
            hintsUsed: progressData.hintsUsed || 0,
            homeworkScore: progressData.homeworkScore,
            lastAccessedAt: progressData.lastAccessedAt,
            medal: progressData.medal || 'none',
            mistakes: progressData.mistakes || 0,
            points: progressData.points || 0,
            pointsEarned: progressData.points || 0,
            progressPercent: progressData.progressPercent || 0,
            stars: progressData.stars || 0,
            submittedHomework: progressData.submittedHomework || false,
            topicId: progressData.topicId,
            updatedAt: progressData.updatedAt,
            usedHints: progressData.hintsUsed > 0 || false
          };
          
          console.log('✅ Previous progress loaded:', this.previousProgress);
          console.log(`   - Completed steps: ${this.previousProgress.completedSteps.length}`);
          console.log(`   - Stars: ${this.previousProgress.stars}`);
          console.log(`   - Mistakes: ${this.previousProgress.mistakes}`);
          console.log(`   - Duration: ${this.previousProgress.duration} seconds`);
        } else {
          console.log('ℹ️ No previous progress found for this lesson');
          this.previousProgress = null;
        }
        
      } catch (err) {
        console.warn('⚠️ Failed to load previous progress:', err);
        this.previousProgress = null;
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
      try {
        const success = await this.saveProgress(false);
        if (!success) {
          console.log('🔄 Autosave failed, will retry in 30 seconds');
          setTimeout(() => this.autosaveProgress(), 30000);
        }
      } catch (error) {
        console.error('❌ Autosave error:', error);
      }
    },

    // ✅ REPLACE these 3 methods in LessonPage.vue script section

// ✅ REPLACE the saveProgress method in LessonPage.vue

async saveProgress(completed = false) {
  try {
    // Validation - Check required data
    if (!this.userId) {
      console.error('❌ No userId available');
      return false;
    }
    
    if (!this.lesson._id) {
      console.error('❌ No lesson ID available');
      return false;
    }

    // Get authentication token with better error handling
    let token;
    try {
      if (!auth.currentUser) {
        console.error('❌ No authenticated user');
        return false;
      }
      token = await auth.currentUser.getIdToken(true); // Force refresh
    } catch (authError) {
      console.error('❌ Failed to get auth token:', authError);
      return false;
    }

    // Build completed steps array safely
    const completedSteps = [];
    if (this.started) {
      const maxIndex = Math.min(this.currentIndex, this.steps.length - 1);
      for (let i = 0; i <= maxIndex; i++) {
        completedSteps.push(i);
      }
    }

    // Calculate progress percentage safely
    const progressPercent = this.steps.length > 0 
      ? Math.floor((completedSteps.length / this.steps.length) * 100) 
      : 0;

    // ✅ SIMPLIFIED: Cleaner data structure
    const progressData = {
      lessonId: String(this.lesson._id),
      topicId: String(this.lesson.topicId || this.lesson._id),
      completedSteps: completedSteps,
      progressPercent: progressPercent,
      completed: completed,
      mistakes: this.mistakeCount,
      medal: this.mistakeCount === 0 ? 'gold' : this.mistakeCount <= 2 ? 'silver' : 'bronze',
      duration: this.elapsedSeconds,
      stars: this.stars,
      points: this.earnedPoints,
      hintsUsed: this.hintsUsed ? 1 : 0,
      submittedHomework: false
    };

    console.log('📤 Saving progress data:', progressData);

    // ✅ FIXED: Try emergency endpoint first, then fallbacks
    let response;
    
    // Try emergency endpoint first (most likely to work)
    try {
      response = await axios.post(`${BASE_URL}/users/${this.userId}/progress/save`, progressData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ Progress saved via EMERGENCY endpoint:', response.data);
        return true;
      }
    } catch (emergencyError) {
      console.warn('⚠️ Emergency endpoint failed:', emergencyError.response?.status, emergencyError.response?.data);
    }
    
    // Try the original progress endpoint
    try {
      // Add userId to the data for the original endpoint
      const originalData = { userId: this.userId, ...progressData };
      
      response = await axios.post(`${BASE_URL}/progress`, originalData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ Progress saved via /api/progress:', response.data);
        return true;
      }
    } catch (progressError) {
      console.warn('⚠️ /api/progress failed:', progressError.response?.status);
    }
    
    // Try a simple POST to user lesson endpoint
    try {
      response = await axios.post(`${BASE_URL}/users/${this.userId}/lesson/${this.lesson._id}`, progressData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ Progress saved via /api/users/lesson:', response.data);
        return true;
      }
    } catch (userLessonError) {
      console.warn('⚠️ /api/users/lesson failed:', userLessonError.response?.status);
    }
    
    console.error('❌ All progress endpoints failed');
    
    // ✅ LAST RESORT: Save to localStorage as backup
    try {
      const backupKey = `lesson_progress_${this.lesson._id}_${this.userId}`;
      const backupData = {
        ...progressData,
        timestamp: Date.now(),
        saved: false
      };
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.log('💾 Progress saved to localStorage as backup');
      
      // Return true so lesson can complete, but mark as unsaved
      return true;
    } catch (localError) {
      console.error('❌ Failed to save backup progress:', localError);
      return false;
    }
    
  } catch (err) {
    console.error('❌ Progress save error:', err);
    return false;
  }
},

async saveAnalytics() {
  try {
    if (!this.userId || !this.lesson._id) return;

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token for analytics');
      return;
    }

    const analyticsData = {
      subject: this.lesson.subject || 'general',
      topic: this.lesson.topic || this.lesson._id,
      timeSpent: this.elapsedSeconds,
      mistakes: this.mistakeCount,
      completed: this.lessonCompleted,
      stars: this.stars,
      points: this.earnedPoints,
      date: new Date().toISOString()
    };

    console.log('📊 Saving analytics:', analyticsData);

    // ✅ FIXED: Try multiple analytics endpoints
    let success = false;
    
    // Try endpoint 1: /api/users/{userId}/analytics
    try {
      await axios.post(`${BASE_URL}/users/${this.userId}/analytics`, analyticsData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      success = true;
      console.log('✅ Analytics saved via /api/users/analytics');
    } catch (usersError) {
      console.warn('⚠️ /api/users/analytics failed:', usersError.response?.status);
    }
    
    // Try endpoint 2: /api/user/{userId}/analytics (legacy)
    if (!success) {
      try {
        await axios.post(`${BASE_URL}/user/${this.userId}/analytics`, analyticsData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        success = true;
        console.log('✅ Analytics saved via /api/user/analytics');
      } catch (userError) {
        console.warn('⚠️ /api/user/analytics failed:', userError.response?.status);
      }
    }
    
    // Try endpoint 3: /api/analytics (general)
    if (!success) {
      try {
        await axios.post(`${BASE_URL}/analytics`, { 
          userId: this.userId, 
          ...analyticsData 
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        success = true;
        console.log('✅ Analytics saved via /api/analytics');
      } catch (generalError) {
        console.warn('⚠️ /api/analytics failed:', generalError.response?.status);
      }
    }
    
    if (!success) {
      console.warn('⚠️ All analytics endpoints failed, skipping analytics');
    }

  } catch (err) {
    console.warn('⚠️ Analytics save error (non-critical):', err.message);
  }
},

async saveDiary() {
  try {
    if (!this.userId || !this.lesson.lessonName) return;

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token for diary');
      return;
    }

    const diaryData = {
      lessonName: this.getLocalized(this.lesson.lessonName),
      duration: this.elapsedSeconds,
      date: new Date().toISOString(),
      mistakes: this.mistakeCount,
      stars: this.stars,
      studyMinutes: Math.ceil(this.elapsedSeconds / 60),
      completedTopics: 1,
      averageGrade: this.stars * 20 // Convert stars to grade (0-100)
    };

    console.log('📔 Saving diary entry:', diaryData);

    // ✅ FIXED: Try multiple diary endpoints
    let success = false;
    
    // Try endpoint 1: /api/users/{userId}/diary
    try {
      await axios.post(`${BASE_URL}/users/${this.userId}/diary`, diaryData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      success = true;
      console.log('✅ Diary saved via /api/users/diary');
    } catch (usersError) {
      console.warn('⚠️ /api/users/diary failed:', usersError.response?.status);
    }
    
    // Try endpoint 2: /api/user/{userId}/diary (legacy)
    if (!success) {
      try {
        await axios.post(`${BASE_URL}/user/${this.userId}/diary`, diaryData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        success = true;
        console.log('✅ Diary saved via /api/user/diary');
      } catch (userError) {
        console.warn('⚠️ /api/user/diary failed:', userError.response?.status);
      }
    }
    
    if (!success) {
      console.warn('⚠️ All diary endpoints failed, skipping diary entry');
    }

  } catch (err) {
    console.warn('⚠️ Diary save error (non-critical):', err.message);
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

      // If this is the last step, complete the lesson
      if (this.isLastStep) {
        this.completeLesson();
      } else {
        // Go to next step
        this.currentIndex++;
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

      // Save final progress with retry logic
      let progressSaved = false;
      let retries = 3;
      
      while (!progressSaved && retries > 0) {
        progressSaved = await this.saveProgress(true);
        if (!progressSaved) {
          retries--;
          if (retries > 0) {
            console.log(`🔄 Progress save failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          }
        }
      }

      if (!progressSaved) {
        alert('Не удалось сохранить прогресс. Проверьте соединение.');
      }

      // Save analytics and diary (non-critical, don't retry)
      await Promise.all([
        this.saveAnalytics(),
        this.saveDiary()
      ]);
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
      this.goToCatalogue();
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

.lesson-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* ===== MODAL STYLES ===== */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  padding: clamp(20px, 4vw, 40px);
  border-radius: clamp(12px, 2vw, 20px);
  text-align: center;
  max-width: min(90vw, 400px);
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: #1e293b;
}

.modal-content p {
  margin: 0 0 24px 0;
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  color: #64748b;
  line-height: 1.5;
}

.modal-content button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: clamp(10px, 2vw, 14px) clamp(16px, 3vw, 24px);
  border-radius: clamp(8px, 1.5vw, 12px);
  font-size: clamp(0.85rem, 2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  margin: 0 8px 8px 0;
  transition: all 0.2s ease;
  min-width: 120px;
}

.modal-content button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

/* ===== INTRO SCREEN ===== */
.intro-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: clamp(20px, 5vw, 40px);
  text-align: center;
  position: relative;
}

.exit-btn {
  position: absolute;
  top: clamp(20px, 4vw, 40px);
  right: clamp(20px, 4vw, 40px);
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: #ef4444;
  cursor: pointer;
  padding: clamp(8px, 2vw, 12px);
  border-radius: clamp(8px, 2vw, 12px);
  transition: all 0.2s ease;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.lesson-title {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 clamp(16px, 3vw, 24px) 0;
  line-height: 1.2;
  max-width: 90%;
}

.intro-screen p {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #64748b;
  margin: clamp(8px, 2vw, 12px) 0;
  line-height: 1.5;
}

.previous-progress {
  background: rgba(59, 130, 246, 0.1);
  padding: clamp(16px, 3vw, 24px);
  border-radius: clamp(12px, 2vw, 16px);
  margin: clamp(16px, 3vw, 24px) 0;
  border: 1px solid rgba(59, 130, 246, 0.2);
  max-width: min(90vw, 400px);
  width: 100%;
}

.continue-btn, .start-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: clamp(12px, 3vw, 16px) clamp(24px, 5vw, 32px);
  border-radius: clamp(10px, 2vw, 14px);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 600;
  cursor: pointer;
  margin: clamp(8px, 2vw, 12px);
  transition: all 0.3s ease;
  min-width: clamp(140px, 30vw, 180px);
}

.continue-btn:hover, .start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.3);
}

/* ===== LESSON LAYOUT ===== */
.lesson-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  gap: 0;
}

.lesson-complete-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: clamp(20px, 4vw, 40px);
}

.lesson-complete-full {
  background: white;
  border-radius: clamp(16px, 3vw, 24px);
  padding: clamp(32px, 6vw, 48px);
  max-width: min(90vw, 600px);
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.lesson-left {
  background: white;
  padding: clamp(20px, 4vw, 32px);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
}

.lesson-right {
  background: #f8fafc;
  padding: clamp(20px, 4vw, 32px);
  display: flex;
  flex-direction: column;
}

/* ===== LESSON HEADER ===== */
.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(16px, 3vw, 24px);
  flex-wrap: wrap;
  gap: 12px;
}

.exit-btn-small {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #ef4444;
  cursor: pointer;
  padding: clamp(6px, 1.5vw, 8px);
  border-radius: clamp(6px, 1.5vw, 8px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.lesson-header .lesson-title {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  flex-grow: 1;
  margin: 0 12px;
  min-width: 0; /* Allow text to shrink */
}

.timer-display {
  font-size: clamp(0.9rem, 2vw, 1rem);
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}

/* ===== PROGRESS BAR ===== */
.progress-bar-wrapper {
  position: relative;
  background: #e2e8f0;
  height: clamp(8px, 2vw, 12px);
  border-radius: clamp(4px, 1vw, 6px);
  margin-bottom: clamp(16px, 3vw, 24px);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: inherit;
  transition: width 0.5s ease;
}

.progress-label {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: #64748b;
  margin-top: 8px;
}

.stars-display {
  position: absolute;
  top: 100%;
  right: 0;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: #f59e0b;
  margin-top: 8px;
}

/* ===== CONTENT AREAS ===== */
.explanation-text {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  line-height: 1.6;
  color: #374151;
  margin-bottom: clamp(20px, 4vw, 32px);
}

.locked-overlay {
  background: rgba(148, 163, 184, 0.1);
  padding: clamp(20px, 4vw, 32px);
  border-radius: clamp(12px, 2vw, 16px);
  text-align: center;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  color: #64748b;
  border: 2px dashed #cbd5e1;
  margin-bottom: clamp(16px, 3vw, 24px);
}

.exercise-question {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  font-weight: 600;
  color: #1e293b;
  margin-bottom: clamp(16px, 3vw, 24px);
  line-height: 1.5;
}

/* ===== OPTIONS AND INPUTS ===== */
.options-container {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2vw, 12px);
  margin-bottom: clamp(16px, 3vw, 24px);
}

.option-label {
  display: flex;
  align-items: center;
  padding: clamp(12px, 3vw, 16px);
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: clamp(8px, 2vw, 12px);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: clamp(0.9rem, 2vw, 1rem);
}

.option-label:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.option-radio {
  margin-right: clamp(8px, 2vw, 12px);
  transform: scale(clamp(1, 2vw, 1.2));
}

.text-input-container {
  margin-bottom: clamp(16px, 3vw, 24px);
}

.answer-textarea {
  width: 100%;
  min-height: clamp(80px, 15vw, 120px);
  padding: clamp(12px, 3vw, 16px);
  border: 2px solid #e2e8f0;
  border-radius: clamp(8px, 2vw, 12px);
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.answer-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ===== BUTTONS ===== */
.navigation-area, .action-buttons {
  display: flex;
  gap: clamp(8px, 2vw, 12px);
  margin-top: auto;
  flex-wrap: wrap;
}

.nav-btn, .submit-btn, .next-btn {
  padding: clamp(10px, 2.5vw, 14px) clamp(16px, 3vw, 24px);
  border: none;
  border-radius: clamp(8px, 2vw, 12px);
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: clamp(100px, 20vw, 120px);
}

.prev-btn {
  background: #f1f5f9;
  color: #64748b;
}

.prev-btn:hover {
  background: #e2e8f0;
}

.nav-btn:not(.prev-btn), .submit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.nav-btn:hover, .submit-btn:hover, .next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ===== CONFIRMATION MESSAGES ===== */
.confirmation {
  margin-top: clamp(12px, 2.5vw, 16px);
  padding: clamp(10px, 2.5vw, 14px);
  border-radius: clamp(8px, 2vw, 12px);
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1rem);
  text-align: center;
}

.confirmation.correct {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.confirmation.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* ===== COMPLETION STYLES ===== */
.lesson-complete-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: #1e293b;
  margin-bottom: clamp(16px, 3vw, 24px);
}

.medal-image {
  width: clamp(80px, 15vw, 120px);
  height: clamp(80px, 15vw, 120px);
  margin: clamp(16px, 3vw, 24px) 0;
}

.medal-label {
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
  font-weight: 600;
  color: #059669;
  margin-bottom: clamp(8px, 2vw, 12px);
}

.completion-time, .completion-motivation, .completion-stats {
  font-size: clamp(0.9rem, 2vw, 1rem);
  margin: clamp(8px, 2vw, 12px) 0;
  color: #64748b;
}

.completion-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(8px, 2vw, 12px);
  justify-content: center;
  margin: clamp(20px, 4vw, 32px) 0;
}

.return-btn, .share-btn, .homework-btn {
  padding: clamp(10px, 2.5vw, 14px) clamp(16px, 3vw, 24px);
  border: none;
  border-radius: clamp(8px, 2vw, 12px);
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: clamp(120px, 25vw, 150px);
}

.return-btn {
  background: #f1f5f9;
  color: #64748b;
}

.share-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.homework-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

/* ===== MISTAKE REVIEW ===== */
.mistake-review {
  background: rgba(239, 68, 68, 0.05);
  padding: clamp(16px, 3vw, 24px);
  border-radius: clamp(12px, 2vw, 16px);
  margin-top: clamp(20px, 4vw, 32px);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.mistake-review h4 {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #991b1b;
  margin-bottom: clamp(12px, 2.5vw, 16px);
}

.mistake-review ul {
  list-style: none;
  padding: 0;
}

.mistake-review li {
  background: white;
  padding: clamp(12px, 3vw, 16px);
  border-radius: clamp(8px, 2vw, 12px);
  margin-bottom: clamp(8px, 2vw, 12px);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  line-height: 1.5;
}

.mistake-review button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px);
  border-radius: clamp(6px, 1.5vw, 8px);
  font-size: clamp(0.8rem, 1.8vw, 0.9rem);
  cursor: pointer;
  margin-top: 8px;
}

/* ===== CONFETTI CANVAS ===== */
.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

/* ===== AI ASSISTANT STYLES ===== */
.floating-robot {
  position: fixed;
  bottom: clamp(16px, 3vw, 24px);
  left: clamp(16px, 3vw, 24px);
  width: clamp(100px, 20vw, 150px);
  height: clamp(100px, 20vw, 150px);
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

.ai-help-btn {
  position: fixed;
  bottom: clamp(16px, 3vw, 24px);
  right: clamp(16px, 3vw, 24px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 600;
  padding: clamp(10px, 2.5vw, 14px) clamp(16px, 3vw, 20px);
  border-radius: clamp(12px, 2.5vw, 16px);
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 9998;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ai-help-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 12px 32px rgba(102, 126, 234, 0.5),
    0 8px 16px rgba(0, 0, 0, 0.15);
}

.ai-chat-modal {
  position: fixed;
  bottom: clamp(80px, 15vw, 100px);
  right: clamp(16px, 3vw, 24px);
  width: clamp(300px, 80vw, 380px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: clamp(16px, 3vw, 20px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: clamp(300px, 60vh, 520px);
  animation: modal-slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

.ai-chat-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: clamp(12px, 3vw, 16px) clamp(16px, 3vw, 20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #1e293b;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  font-size: clamp(0.9rem, 2vw, 1rem);
}

.ai-chat-body {
  padding: clamp(16px, 3vw, 20px);
  flex-grow: 1;
  overflow-y: auto;
  font-size: clamp(0.85rem, 2vw, 0.9rem);
  background: linear-gradient(180deg, #fafafa 0%, #f1f5f9 100%);
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2vw, 12px);
}

.chat-message {
  padding: clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px);
  border-radius: clamp(12px, 2.5vw, 16px);
  line-height: 1.6;
  max-width: 85%;
  position: relative;
  word-wrap: break-word;
  animation: message-appear 0.3s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.ai-close-btn {
  background: rgba(148, 163, 184, 0.1);
  border: none;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  width: clamp(24px, 5vw, 32px);
  height: clamp(24px, 5vw, 32px);
  border-radius: clamp(6px, 1.5vw, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== RESPONSIVE BREAKPOINTS ===== */

/* Large Laptops (1440px+) */
@media (min-width: 1440px) {
  .lesson-page {
    font-size: 18px;
  }
  
  .lesson-split {
    max-width: 1600px;
    margin: 0 auto;
  }
  
  .lesson-left, .lesson-right {
    padding: 48px;
  }
}

/* Standard Laptops (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .lesson-split {
    grid-template-columns: 1fr 1fr;
  }
  
  .lesson-left, .lesson-right {
    padding: 32px;
  }
  
  .floating-robot {
    width: 130px;
    height: 130px;
  }
}

/* Small Laptops (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .lesson-split {
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }
  
  .lesson-left, .lesson-right {
    padding: 24px;
  }
  
  .lesson-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .lesson-header .lesson-title {
    margin: 0;
    text-align: left;
  }
  
  .ai-chat-modal {
    width: min(90vw, 350px);
  }
}

/* iPad Pro (1024px+ in portrait) */
@media (min-width: 834px) and (max-width: 1194px) and (orientation: portrait) {
  .lesson-split {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .lesson-left {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .lesson-right {
    background: white;
  }
}

/* iPad (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .options-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .completion-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .homework-btn {
    grid-column: 1 / -1;
  }
}

/* Large Phones & Small Tablets (480px - 767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .lesson-split {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .lesson-left {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    min-height: auto;
  }
  
  .lesson-right {
    background: white;
  }
  
  .lesson-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-content button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
  
  .ai-chat-modal {
    width: calc(100vw - 32px);
    right: 16px;
    left: 16px;
    bottom: 90px;
    max-height: 60vh;
  }
  
  .floating-robot {
    width: 100px;
    height: 100px;
  }
}

/* Small Phones (320px - 479px) */
@media (max-width: 479px) {
  .lesson-split {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .lesson-left {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px;
  }
  
  .lesson-right {
    background: white;
    padding: 16px;
  }
  
  .lesson-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .exit-btn-small {
    align-self: flex-end;
  }
  
  .lesson-header .lesson-title {
    font-size: 1.1rem;
    margin: 0;
    order: 2;
  }
  
  .timer-display {
    order: 3;
    align-self: flex-start;
  }
  
  .progress-label, .stars-display {
    position: static;
    display: block;
    margin-top: 8px;
  }
  
  .stars-display {
    text-align: right;
  }
  
  .options-container {
    gap: 8px;
  }
  
  .option-label {
    padding: 10px;
    font-size: 0.85rem;
  }
  
  .navigation-area, .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .nav-btn, .submit-btn, .next-btn {
    width: 100%;
    min-width: auto;
  }
  
  .completion-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .return-btn, .share-btn, .homework-btn {
    width: 100%;
    min-width: auto;
  }
  
  .ai-chat-modal {
    width: calc(100vw - 16px);
    right: 8px;
    left: 8px;
    bottom: 80px;
    max-height: 50vh;
  }
  
  .ai-chat-header {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
  
  .ai-chat-body {
    padding: 12px;
  }
  
  .chat-message {
    max-width: 95%;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .floating-robot {
    width: 80px;
    height: 80px;
    bottom: 12px;
    left: 12px;
  }
  
  .ai-help-btn {
    bottom: 12px;
    right: 12px;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .modal {
    padding: 16px;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .intro-screen {
    padding: 20px 16px;
  }
  
  .exit-btn {
    top: 16px;
    right: 16px;
  }
}

/* Extra Small Phones (below 320px) */
@media (max-width: 319px) {
  .lesson-page {
    font-size: 14px;
  }
  
  .lesson-left, .lesson-right {
    padding: 12px;
  }
  
  .lesson-title {
    font-size: 1rem !important;
  }
  
  .explanation-text {
    font-size: 0.9rem;
  }
  
  .exercise-question {
    font-size: 0.95rem;
  }
  
  .floating-robot {
    width: 60px;
    height: 60px;
  }
  
  .ai-help-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
  
  .ai-chat-modal {
    max-height: 40vh;
  }
}

/* ===== LANDSCAPE ORIENTATION ADJUSTMENTS ===== */
@media (max-height: 500px) and (orientation: landscape) {
  .intro-screen {
    min-height: auto;
    padding: 20px;
  }
  
  .lesson-split {
    min-height: auto;
  }
  
  .ai-chat-modal {
    max-height: 80vh;
    bottom: 60px;
  }
  
  .floating-robot {
    width: 60px;
    height: 60px;
  }
  
  .modal-content {
    max-height: 80vh;
    overflow-y: auto;
  }
}

/* ===== HIGH DPI DISPLAYS ===== */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .medal-image {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  
  .floating-robot img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* ===== TOUCH DEVICE OPTIMIZATIONS ===== */
@media (hover: none) and (pointer: coarse) {
  .option-label {
    min-height: 44px; /* iOS recommended touch target */
  }
  
  .nav-btn, .submit-btn, .next-btn {
    min-height: 44px;
  }
  
  .exit-btn, .exit-btn-small {
    min-width: 44px;
    min-height: 44px;
  }
  
  .ai-help-btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .ai-close-btn {
    min-width: 44px;
    min-height: 44px;
  }
}

/* ===== ACCESSIBILITY ENHANCEMENTS ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .floating-robot {
    animation: none;
  }
  
  .gentle-float {
    animation: none;
  }
  
  .modal-appear, .message-appear, .modal-slide-up {
    animation: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .lesson-page {
    background: #ffffff;
  }
  
  .lesson-left, .lesson-right {
    background: #ffffff;
    border: 2px solid #000000;
  }
  
  .option-label {
    border: 2px solid #000000;
    background: #ffffff;
  }
  
  .option-label:hover {
    background: #f0f0f0;
    border-color: #000000;
  }
  
  .ai-chat-modal {
    border: 2px solid #000000;
    background: #ffffff;
  }
  
  .chat-message.ai {
    background: #f0f0f0;
    color: #000000;
    border: 1px solid #000000;
  }
  
  .chat-message.user {
    background: #e0e0e0;
    color: #000000;
    border: 1px solid #000000;
  }
}

/* ===== FOCUS MANAGEMENT ===== */
.ai-help-btn:focus,
.ai-close-btn:focus,
.nav-btn:focus,
.submit-btn:focus,
.next-btn:focus,
.option-radio:focus,
.answer-textarea:focus {
  outline: 3px solid #4f46e5;
  outline-offset: 2px;
}

/* ===== PRINT STYLES ===== */
@media print {
  .floating-robot,
  .ai-help-btn,
  .ai-chat-modal,
  .exit-btn,
  .exit-btn-small {
    display: none !important;
  }
  
  .lesson-split {
    grid-template-columns: 1fr;
  }
  
  .lesson-left, .lesson-right {
    border: none;
    box-shadow: none;
  }
  
  * {
    background: white !important;
    color: black !important;
  }
}

/* ===== LOADING STATES ===== */
.chat-message.loading {
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ===== SCROLLBAR STYLING ===== */
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

/* ===== DARK MODE SUPPORT ===== */
@media (prefers-color-scheme: dark) {
  .lesson-page {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #e2e8f0;
  }
  
  .lesson-left, .lesson-right {
    background: #334155;
    border-color: #475569;
  }
  
  .modal-content {
    background: #334155;
    color: #e2e8f0;
  }
  
  .option-label {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }
  
  .answer-textarea {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }
  
  .explanation-text, .exercise-question {
    color: #e2e8f0;
  }
  
  .ai-chat-modal {
    background: rgba(51, 65, 85, 0.95);
  }
  
  .ai-chat-header {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    color: #e2e8f0;
  }
  
  .ai-chat-body {
    background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
  }
}
</style>
