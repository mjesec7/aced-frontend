
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
      return this.$router.push('/login');
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
          console.log('❌ No Firebase user - redirecting to login');
          return this.$router.push('/login');
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
          console.error('❌ Authentication error - redirecting to login');
          return this.$router.push('/login');
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

        // ✅ FIXED: Better topicId handling
        let topicId = this.lesson.topicId || this.lesson._id;
        if (this.lesson.topic && 
            this.lesson.topic !== null && 
            this.lesson.topic !== undefined && 
            this.lesson.topic !== '') {
          topicId = this.lesson.topicId || this.lesson.topic;
        }

        // Build progress data with validation
        const progressData = {
          userId: String(this.userId),
          lessonId: String(this.lesson._id),
          topicId: String(topicId),
          completedSteps: completedSteps,
          progressPercent: Math.max(0, Math.min(100, progressPercent)),
          completed: completed,
          mistakes: Math.max(0, parseInt(this.mistakeCount) || 0),
          medal: this.mistakeCount === 0 ? 'gold' : this.mistakeCount <= 2 ? 'silver' : 'bronze',
          duration: Math.max(0, parseInt(this.elapsedSeconds) || 0),
          stars: Math.max(0, parseInt(this.stars) || 0),
          points: Math.max(0, parseInt(this.earnedPoints) || 0),
          hintsUsed: Math.max(0, this.hintsUsed ? 1 : 0),
          submittedHomework: false
        };

        // Add completion data if completed
        if (completed) {
          progressData.completedAt = new Date().toISOString();
        }

        console.log('📤 Saving progress data:', progressData);

        // Make API request with improved error handling
        const response = await axios.post(`${BASE_URL}/progress`, progressData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500;
          }
        });

        if (response.status === 200 || response.status === 201) {
          console.log('✅ Progress saved successfully:', response.data);
          return true;
        } else {
          console.error('❌ Progress save failed:', response.status, response.data);
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
          points: this.earnedPoints
        };

        console.log('📊 Saving analytics:', analyticsData);

        await axios.post(`${BASE_URL}/user/${this.userId}/analytics`, analyticsData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

        console.log('✅ Analytics saved successfully');
      } catch (err) {
        console.error('❌ Analytics save error:', err);
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
          stars: this.stars
        };

        console.log('📔 Saving diary entry:', diaryData);

        await axios.post(`${BASE_URL}/user/${this.userId}/diary`, diaryData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

        console.log('✅ Diary entry saved successfully');
      } catch (err) {
        console.error('❌ Diary save error:', err);
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
