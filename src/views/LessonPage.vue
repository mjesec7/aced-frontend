<template>
  <div class="lesson-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Загрузка урока...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-screen">
      <div class="error-icon">❌</div>
      <h3>Ошибка загрузки урока</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retryLoad" class="retry-btn">🔄 Попробовать снова</button>
        <button @click="$router.push('/catalogue')" class="back-btn">⬅️ К каталогу</button>
      </div>
    </div>

    <!-- Paywall Modal -->
    <div v-if="showPaywallModal" class="modal-overlay">
      <div class="modal-content">
        <h3>🔒 Платный контент</h3>
        <p>Этот урок доступен только для подписчиков.</p>
        <div class="modal-actions">
          <button @click="$router.push('/pay/start')" class="premium-btn">💳 Получить подписку</button>
          <button @click="$router.push('/catalogue')" class="cancel-btn">⬅️ Назад к каталогу</button>
        </div>
      </div>
    </div>

    <!-- Exit Confirmation Modal -->
    <div v-if="showExitModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Вы действительно хотите выйти?</h3>
        <p>Ваш прогресс будет сохранён автоматически.</p>
        <div class="modal-actions">
          <button @click="exitLesson" class="confirm-btn">Да, выйти</button>
          <button @click="cancelExit" class="cancel-btn">Нет, остаться</button>
        </div>
      </div>
    </div>

    <!-- Intro Screen -->
    <div v-if="!started && !showPaywallModal && !loading && !error" class="intro-screen">
      <button class="exit-btn" @click="confirmExit">✕</button>
      
      <div class="intro-content">
        <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) || 'Без названия' }}</h2>
        <p class="lesson-description">{{ getLocalized(lesson.description) || 'Описание недоступно' }}</p>
        
        <div class="lesson-info-grid">
          <div class="info-card">
            <div class="info-icon">⏱️</div>
            <div class="info-text">
              <span class="info-label">Время</span>
              <span class="info-value">~{{ estimatedTime }} мин</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">📝</div>
            <div class="info-text">
              <span class="info-label">Шагов</span>
              <span class="info-value">{{ steps.length }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🎯</div>
            <div class="info-text">
              <span class="info-label">Тип</span>
              <span class="info-value">{{ lesson.type === 'premium' ? 'Премиум' : 'Бесплатный' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Previous Progress Display -->
        <div v-if="previousProgress && previousProgress.completedSteps.length > 0" class="previous-progress">
          <h4>📈 Предыдущий прогресс</h4>
          <div class="progress-stats-grid">
            <div class="stat">
              <span class="stat-value">{{ previousProgress.completedSteps.length }}/{{ steps.length }}</span>
              <span class="stat-label">Прогресс</span>
            </div>
            <div class="stat">
              <span class="stat-value">⭐ {{ previousProgress.stars || 0 }}</span>
              <span class="stat-label">Звезды</span>
            </div>
            <div class="stat">
              <span class="stat-value">❌ {{ previousProgress.mistakes || 0 }}</span>
              <span class="stat-label">Ошибки</span>
            </div>
          </div>
          <button @click="continuePreviousProgress" class="continue-btn">
            📖 Продолжить с места остановки
          </button>
        </div>
        
        <div class="intro-actions">
          <button class="start-btn" @click="startLesson">
            {{ previousProgress ? '🔄 Начать заново' : '🚀 Начать урок' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Lesson Content - ALWAYS SPLIT SCREEN -->
    <div v-else-if="started && !showPaywallModal && !loading && !error" class="lesson-container">
      
      <!-- Top Header -->
      <div class="lesson-header">
        <button class="exit-btn-small" @click="confirmExit">✕</button>
        <h2 class="lesson-title">{{ getLocalized(lesson.lessonName) }}</h2>
        <div class="lesson-meta">
          <div class="timer-display">⏱ {{ formattedTime }}</div>
          <div class="step-counter">{{ currentIndex + 1 }}/{{ steps.length }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <div class="progress-info">
          <span class="progress-label">{{ progressPercentage }}% завершено</span>
          <span class="stars-display">⭐ {{ stars }}</span>
        </div>
      </div>

      <!-- Split Screen Content -->
      <div class="split-content">
        
        <!-- Left Panel - Content Display -->
        <div class="content-panel">
          <div class="step-header">
            <h3 class="step-title">
              <span class="step-number">{{ currentIndex + 1 }}</span>
              <span class="step-type-icon">{{ getStepIcon(currentStep?.type) }}</span>
              <span class="step-type-text">{{ getStepTypeText(currentStep?.type) }}</span>
            </h3>
          </div>
          
          <div class="step-content">
            <!-- Explanation or Reading Step -->
            <div v-if="['explanation', 'example', 'reading'].includes(currentStep?.type)" class="text-content">
              <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
              
              <!-- AI Help for Explanations -->
              <div v-if="showExplanationHelp" class="explanation-help">
                <h4>🤖 Нужна помощь с пониманием?</h4>
                <div class="explanation-help-input">
                  <input 
                    v-model="explanationQuestion" 
                    placeholder="Задайте вопрос об этом объяснении..."
                    @keyup.enter="askAboutExplanation"
                  />
                  <button @click="askAboutExplanation" :disabled="!explanationQuestion.trim()">
                    Спросить AI
                  </button>
                </div>
                <div v-if="explanationAIResponse" class="ai-response">
                  <p>{{ explanationAIResponse }}</p>
                </div>
              </div>
            </div>

            <!-- Vocabulary Step -->
            <div v-else-if="currentStep?.type === 'vocabulary'" class="vocabulary-content">
              <div v-if="Array.isArray(currentStep.data)" class="vocabulary-list">
                <div v-for="(vocab, index) in currentStep.data" :key="index" class="vocabulary-item">
                  <div class="vocab-term">{{ vocab.term }}</div>
                  <div class="vocab-definition">{{ vocab.definition }}</div>
                  <div v-if="vocab.example" class="vocab-example">
                    <strong>Пример:</strong> {{ vocab.example }}
                  </div>
                </div>
              </div>
              <div v-else class="single-vocabulary">
                <div class="vocab-term">{{ currentStep.data.term || 'Термин' }}</div>
                <div class="vocab-definition">{{ currentStep.data.definition || 'Определение' }}</div>
                <div v-if="currentStep.data.example" class="vocab-example">
                  <strong>Пример:</strong> {{ currentStep.data.example }}
                </div>
              </div>
            </div>

            <!-- Video/Audio Step -->
            <div v-else-if="['video', 'audio'].includes(currentStep?.type)" class="media-content">
              <div class="media-placeholder">
                <div class="media-icon">{{ currentStep.type === 'video' ? '🎬' : '🎵' }}</div>
                <h4>{{ currentStep.type === 'video' ? 'Видео урок' : 'Аудио урок' }}</h4>
                <p>{{ currentStep.data.description || 'Мультимедиа контент' }}</p>
                <div class="media-url">{{ currentStep.data.url || 'URL недоступен' }}</div>
              </div>
            </div>

            <!-- Default content for other step types -->
            <div v-else class="default-content">
              <div class="content-text" v-html="formatContent(getStepContent(currentStep))"></div>
            </div>
          </div>
          
          <!-- Content Navigation -->
          <div class="content-navigation">
            <button v-if="currentIndex > 0" class="nav-btn prev-btn" @click="goPrevious">
              ⬅️ Назад
            </button>
            <button 
              v-if="!isInteractiveStep" 
              class="nav-btn next-btn" 
              @click="goNext"
            >
              {{ isLastStep ? '🏁 Завершить' : '➡️ Далее' }}
            </button>
            <button 
              v-if="['explanation', 'example', 'reading'].includes(currentStep?.type)"
              class="help-btn" 
              @click="showExplanationHelp = !showExplanationHelp"
              :class="{ active: showExplanationHelp }"
            >
              🤖 {{ showExplanationHelp ? 'Скрыть помощь' : 'AI помощь' }}
            </button>
          </div>
        </div>

        <!-- Right Panel - Interactive Content -->
        <div class="interactive-panel">
          
          <!-- Exercise/Practice Step -->
          <div v-if="isInteractiveStep && ['exercise', 'practice'].includes(currentStep?.type)" class="exercise-container">
            <div class="exercise-header">
              <h3 class="exercise-title">
                {{ currentStep.type === 'practice' ? '🧪 Практическое задание' : '✏️ Упражнение' }}
              </h3>
            </div>
            
            <div class="exercise-content">
              <div class="exercise-question">
                {{ getExerciseQuestion(currentStep) }}
              </div>
              
              <!-- Multiple Choice Options -->
              <div v-if="hasOptions(currentStep)" class="options-grid">
                <label 
                  v-for="(option, index) in getOptions(currentStep)" 
                  :key="index" 
                  class="option-card"
                  :class="{ 
                    selected: userAnswer === option,
                    correct: answerWasCorrect && userAnswer === option,
                    incorrect: !answerWasCorrect && userAnswer === option && confirmation
                  }"
                >
                  <input 
                    type="radio" 
                    :value="option" 
                    v-model="userAnswer" 
                    class="option-radio"
                    :disabled="answerWasCorrect"
                  />
                  <div class="option-content">
                    <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                    <span class="option-text">{{ option }}</span>
                  </div>
                </label>
              </div>
              
              <!-- Text Input -->
              <div v-else class="text-input-container">
                <textarea 
                  v-model="userAnswer" 
                  placeholder="Введите ваш ответ..."
                  class="answer-textarea"
                  :disabled="answerWasCorrect"
                  @keyup.enter="handleSubmitOrNext"
                ></textarea>
              </div>

              <!-- Smart Hint Display -->
              <div v-if="smartHint" class="smart-hint">
                <div class="hint-header">💡 Подсказка от AI</div>
                <div class="hint-content">{{ smartHint }}</div>
                <button @click="smartHint = ''" class="close-hint-btn">✕</button>
              </div>

              <!-- Answer Feedback -->
              <div v-if="confirmation" :class="['feedback', { 'correct': answerWasCorrect, 'incorrect': !answerWasCorrect }]">
                <div class="feedback-icon">{{ answerWasCorrect ? '✅' : '❌' }}</div>
                <div class="feedback-text">{{ confirmation }}</div>
              </div>

              <!-- Action Buttons -->
              <div class="exercise-actions">
                <button 
                  v-if="!answerWasCorrect" 
                  class="submit-btn" 
                  @click="handleSubmitOrNext" 
                  :disabled="!userAnswer.trim()"
                >
                  🔍 Проверить ответ
                </button>
                <button 
                  v-else 
                  class="next-btn" 
                  @click="goNext"
                >
                  {{ isLastStep ? '🏁 Завершить' : '➡️ Далее' }}
                </button>
                
                <button 
                  v-if="!answerWasCorrect && mistakeCount >= 2" 
                  class="hint-btn"
                  @click="showHint"
                >
                  💡 Подсказка
                </button>
              </div>

              <!-- Regular Hint Display -->
              <div v-if="currentHint" class="hint-display">
                <div class="hint-header">💡 Подсказка</div>
                <div class="hint-content">{{ currentHint }}</div>
              </div>
            </div>
          </div>

          <!-- Quiz Step -->
          <div v-else-if="isInteractiveStep && currentStep?.type === 'quiz'" class="quiz-container">
            <div class="quiz-header">
              <h3 class="quiz-title">🧩 Викторина</h3>
            </div>
            
            <div class="quiz-content">
              <div class="quiz-question">{{ getQuizQuestion(currentStep) }}</div>
              
              <div class="quiz-options">
                <label 
                  v-for="(option, index) in getQuizOptions(currentStep)" 
                  :key="index" 
                  class="quiz-option-card"
                  :class="{ 
                    selected: userAnswer === option,
                    correct: answerWasCorrect && userAnswer === option,
                    incorrect: !answerWasCorrect && userAnswer === option && confirmation
                  }"
                >
                  <input 
                    type="radio" 
                    :value="option" 
                    v-model="userAnswer" 
                    class="quiz-radio"
                    :disabled="answerWasCorrect"
                  />
                  <div class="quiz-option-content">
                    <span class="quiz-option-letter">{{ String.fromCharCode(65 + index) }}</span>
                    <span class="quiz-option-text">{{ option }}</span>
                  </div>
                </label>
              </div>

              <div v-if="confirmation" :class="['feedback', { 'correct': answerWasCorrect, 'incorrect': !answerWasCorrect }]">
                <div class="feedback-icon">{{ answerWasCorrect ? '✅' : '❌' }}</div>
                <div class="feedback-text">{{ confirmation }}</div>
              </div>

              <div class="quiz-actions">
                <button 
                  v-if="!answerWasCorrect" 
                  class="submit-btn" 
                  @click="handleSubmitOrNext" 
                  :disabled="!userAnswer"
                >
                  🔍 Ответить
                </button>
                <button 
                  v-else 
                  class="next-btn" 
                  @click="goNext"
                >
                  {{ isLastStep ? '🏁 Завершить' : '➡️ Далее' }}
                </button>
              </div>
            </div>
          </div>

          <!-- AI Help Panel for Interactive Steps -->
          <div v-else-if="isInteractiveStep" class="ai-help-panel">
            <h4>🤖 AI Помощник</h4>
            <p>Выберите ответ слева, и я помогу вам с объяснениями!</p>
            
            <!-- Quick suggestions -->
            <div v-if="aiSuggestions.length" class="quick-suggestions">
              <p><strong>Популярные вопросы:</strong></p>
              <button 
                v-for="suggestion in aiSuggestions" 
                :key="suggestion"
                @click="askAI(suggestion)"
                class="suggestion-btn"
              >
                {{ suggestion }}
              </button>
            </div>
            
            <!-- Chat input -->
            <div class="ai-chat-input">
              <input 
                v-model="aiChatInput" 
                @keyup.enter="sendAIMessage"
                placeholder="Спросите об этом упражнении..."
                :disabled="aiIsLoading"
              />
              <button 
                @click="sendAIMessage" 
                :disabled="!aiChatInput.trim() || aiIsLoading"
              >
                {{ aiIsLoading ? '⏳' : '📤' }}
              </button>
            </div>
            
            <!-- Chat history -->
            <div v-if="aiChatHistory.length" class="ai-chat-history">
              <div 
                v-for="message in aiChatHistory.slice(-3)" 
                :key="message.id"
                :class="['chat-message', message.type]"
              >
                <strong v-if="message.type === 'user'">Вы:</strong>
                <strong v-else>🤖 AI:</strong>
                {{ message.content }}
              </div>
            </div>
          </div>

          <!-- Non-interactive step placeholder -->
          <div v-else class="non-interactive-panel">
            <div class="panel-placeholder">
              <div class="placeholder-icon">📖</div>
              <h4>Изучите материал слева</h4>
              <p>Внимательно прочитайте объяснение и переходите к следующему шагу</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lesson Completion Screen -->
    <div v-if="lessonCompleted" class="completion-screen">
      <div class="completion-content">
        <div class="completion-header">
          <h3 class="completion-title">🏆 Урок завершён!</h3>
          <div class="medal-section">
            <div class="medal-icon">{{ getMedalIcon() }}</div>
            <p class="medal-label">{{ medalLabel }}</p>
          </div>
        </div>
        
        <div class="completion-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ readableTime }}</div>
            <div class="stat-label">Время</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ stars }}</div>
            <div class="stat-label">Звезды</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">❌</div>
            <div class="stat-value">{{ mistakeCount }}</div>
            <div class="stat-label">Ошибки</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ earnedPoints }}</div>
            <div class="stat-label">Очки</div>
          </div>
        </div>
        
        <!-- AI Progress Insight -->
        <div v-if="progressInsight" class="progress-insight">
          <h4>🤖 Анализ прогресса</h4>
          <p>{{ progressInsight }}</p>
        </div>
        
        <div class="completion-actions">
          <button class="action-btn primary" @click="$router.push('/catalogue')">📚 К каталогу</button>
          <button class="action-btn secondary" @click="shareResult">📤 Поделиться</button>
          <button class="action-btn secondary" @click="goToHomework">📝 Домашнее задание</button>
        </div>
      </div>
    </div>

    <!-- Floating AI Assistant Toggle -->
    <button 
      v-if="started && !lessonCompleted" 
      class="floating-ai-btn" 
      @click="toggleFloatingAI"
      :class="{ active: showFloatingAI }"
    >
      🤖
    </button>

    <!-- Floating AI Assistant -->
    <div v-if="showFloatingAI && started && !lessonCompleted" class="floating-ai-assistant">
      <div class="ai-header">
        <h4>🤖 AI Помощник</h4>
        <button @click="showFloatingAI = false" class="close-ai-btn">✕</button>
      </div>
      
      <div class="ai-body">
        <div v-if="aiUsage" class="usage-display">
          <p>📊 Использовано: {{ aiUsage.messages }}/{{ aiUsage.plan === 'free' ? '50' : '∞' }}</p>
        </div>
        
        <div class="quick-suggestions">
          <button 
            v-for="suggestion in quickSuggestions" 
            :key="suggestion"
            @click="askAI(suggestion)"
            class="quick-suggestion-btn"
          >
            {{ suggestion }}
          </button>
        </div>
        
        <div class="ai-chat-area">
          <div class="chat-messages">
            <div 
              v-for="message in aiChatHistory.slice(-5)" 
              :key="message.id"
              :class="['chat-message', message.type]"
            >
              {{ message.content }}
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              v-model="floatingAIInput" 
              @keyup.enter="sendFloatingAIMessage"
              placeholder="Спросите о текущем шаге..."
              :disabled="aiIsLoading"
            />
            <button 
              @click="sendFloatingAIMessage" 
              :disabled="!floatingAIInput.trim() || aiIsLoading"
            >
              {{ aiIsLoading ? '⏳' : '📤' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confetti Animation -->
    <canvas v-if="showConfetti" ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import confetti from 'canvas-confetti';
import { auth } from '@/firebase';
import { mapGetters, mapState } from 'vuex';
import { 
  getLessonById, 
  getLessonProgress, 
  submitProgress,
  getUserStatus,
  withErrorHandling
} from '@/api';

// Enhanced GPT service imports
import { 
  getLessonAIResponse, 
  generateLessonSuggestions, 
  generateSmartHint, 
  generateProgressInsight,
  getExplanationHelp,
  getUserUsage,
  formatUsageDisplay
} from '@/services/GPTService';

export default {
  name: 'LessonPage',
  data() {
    return {
      // Core lesson data
      lesson: {},
      steps: [],
      currentIndex: 0,
      started: false,
      loading: true,
      error: null,
      retryCount: 0,
      
      // User interaction
      userAnswer: '',
      confirmation: '',
      answerWasCorrect: false,
      currentHint: '',
      
      // Progress tracking
      mistakeCount: 0,
      stars: 0,
      earnedPoints: 0,
      hintsUsed: false,
      mistakeLog: [],
      previousProgress: null,
      
      // Lesson state
      lessonCompleted: false,
      elapsedSeconds: 0,
      timerInterval: null,
      autosaveTimer: null,
      
      // UI state
      showConfetti: false,
      showPaywallModal: false,
      showExitModal: false,
      
      // Medal system
      medalLabel: '',
      
      // User identification
      userId: null,
      
      // AI Integration
      aiChatHistory: [],
      aiChatInput: '',
      aiSuggestions: [],
      smartHint: '',
      aiIsLoading: false,
      showFloatingAI: false,
      floatingAIInput: '',
      quickSuggestions: [],
      aiUsage: null,
      progressInsight: '',
      
      // Explanation Help
      showExplanationHelp: false,
      explanationQuestion: '',
      explanationAIResponse: ''
    };
  },
  
  computed: {
    ...mapState(['user']),
    ...mapGetters(['isAuthenticated']),
    
    userStatus() {
      return this.$store.state.user?.subscriptionPlan || 
             this.$store.getters['user/userStatus'] || 
             this.user?.subscriptionPlan || 
             localStorage.getItem('subscriptionPlan') || 
             'free';
    },
    
    isPremiumUser() {
      const status = this.userStatus;
      const premiumStatuses = ['premium', 'start', 'pro'];
      return premiumStatuses.includes(status) || 
             premiumStatuses.includes(localStorage.getItem('subscriptionPlan'));
    },
    
    currentStep() {
      return this.steps[this.currentIndex] || null;
    },
    
    isInteractiveStep() {
      return this.currentStep && ['exercise', 'practice', 'quiz'].includes(this.currentStep.type);
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
    },

    estimatedTime() {
      return this.lesson.metadata?.estimatedDuration || 
             Math.max(5, this.steps.length * 2);
    }
  },
  
  async mounted() {
    console.log('🔧 LessonPage mounted');
    
    await this.waitForAuth();
    
    this.userId = localStorage.getItem('firebaseUserId') || 
                  localStorage.getItem('userId') || 
                  auth.currentUser?.uid;
    
    if (!this.userId) {
      console.error('❌ No user ID found');
      return this.$router.push('/');
    }
    
    if (!this.isAuthenticated && !auth.currentUser) {
      console.error('❌ User not authenticated');
      return this.$router.push('/Login');
    }
    
    console.log('✅ Authentication confirmed, loading lesson...');
    await this.loadLesson();
    await this.loadPreviousProgress();
    await this.loadAIUsage();
  },
  
  beforeUnmount() {
    this.clearTimers();
    if (this.started && !this.lessonCompleted) {
      this.saveProgress(false);
    }
  },
  
  methods: {
    // Authentication
    async waitForAuth() {
      console.log('⏳ Waiting for authentication...');
      
      if (auth.currentUser) {
        console.log('✅ User already authenticated:', auth.currentUser.email);
        return;
      }
      
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          console.log('🔐 Auth state changed:', user ? user.email : 'No user');
          unsubscribe();
          
          if (user && this.$store.commit) {
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
          
          resolve();
        });
        
        setTimeout(() => {
          console.warn('⚠️ Authentication wait timeout');
          unsubscribe();
          resolve();
        }, 5000);
      });
    },

    // Lesson Loading
    async loadLesson() {
      try {
        const lessonId = this.$route.params.id;
        console.log('📚 Loading lesson:', lessonId);
        
        this.loading = true;
        this.error = null;

        const lessonResult = await withErrorHandling(
          () => getLessonById(lessonId),
          'Load lesson'
        );

        this.lesson = lessonResult.lesson || lessonResult.data || lessonResult;

        if (!this.lesson || !this.lesson._id) {
          throw new Error('Lesson data is invalid or missing');
        }
        
        const lessonType = this.lesson.type || 'free';
        const userHasPremium = this.isPremiumUser;
        
        console.log('🔐 Access Control Check:', {
          lessonId: this.lesson._id,
          lessonName: this.getLocalized(this.lesson.lessonName),
          lessonType: lessonType,
          userStatus: this.userStatus,
          userHasPremium: userHasPremium,
          isAuthenticated: this.isAuthenticated,
          currentUser: auth.currentUser?.email
        });
        
        if (!auth.currentUser) {
          console.log('❌ No Firebase user - redirecting to Login');
          throw new Error('Authentication required');
        }
        
        if (lessonType === 'premium' && !userHasPremium) {
          console.log('🔒 Premium lesson, user does not have premium access');
          this.showPaywallModal = true;
          this.loading = false;
          return;
        }
        
        console.log('✅ Access granted to lesson');

        this.processLessonSteps();
        
        if (this.steps.length === 0) {
          console.warn('⚠️ No steps found in lesson, creating default step');
          this.steps = [{
            type: 'explanation',
            data: { content: this.lesson.description || 'Lesson content not available' }
          }];
        }
        
        console.log(`✅ Lesson loaded with ${this.steps.length} steps`);
        
      } catch (err) {
        console.error('❌ Error loading lesson:', err);
        
        if (err.message === 'Lesson not found') {
          this.error = 'Урок не найден';
        } else if (err.message === 'Authentication required') {
          this.$router.push('/Login');
          return;
        } else if (err.message === 'Access denied to this lesson') {
          this.error = 'У вас нет доступа к этому уроку';
        } else if (err.response?.status === 500) {
          this.error = 'Ошибка сервера. Попробуйте позже.';
        } else {
          this.error = 'Произошла ошибка при загрузке урока';
        }
      } finally {
        this.loading = false;
      }
    },

    processLessonSteps() {
      this.steps = [];
      
      if (this.lesson.steps && Array.isArray(this.lesson.steps)) {
        this.lesson.steps.forEach(step => {
          if (['exercise', 'practice'].includes(step.type) && Array.isArray(step.data)) {
            this.steps.push(...step.data.map(ex => ({ type: step.type, data: ex })));
          } else {
            this.steps.push(step);
          }
        });
      } else {
        // Legacy format support
        if (Array.isArray(this.lesson.explanations)) {
          this.steps.push(...this.lesson.explanations.map(ex => ({ 
            type: 'explanation', 
            data: typeof ex === 'string' ? { content: ex } : ex 
          })));
        }
        if (Array.isArray(this.lesson.examples)) {
          this.steps.push(...this.lesson.examples.map(ex => ({ 
            type: 'example', 
            data: typeof ex === 'string' ? { content: ex } : ex 
          })));
        }
        if (Array.isArray(this.lesson.exerciseGroups)) {
          this.lesson.exerciseGroups.forEach(group => {
            if (group.exercises) {
              group.exercises.forEach(ex => this.steps.push({ type: 'exercise', data: ex }));
            }
          });
        }
        if (Array.isArray(this.lesson.quiz)) {
          this.steps.push(...this.lesson.quiz.map(q => ({ type: 'quiz', data: q })));
        }
      }
    },

    async loadPreviousProgress() {
      if (!this.lesson._id) return;
      
      try {
        console.log(`📋 Loading previous progress for lesson: ${this.lesson._id}`);

        const progressResult = await getLessonProgress(this.userId, this.lesson._id);
        
        if (progressResult.success && progressResult.data) {
          const progressData = progressResult.data;
          
          if (progressData.completedSteps && progressData.completedSteps.length > 0) {
            this.previousProgress = {
              _id: progressData._id,
              userId: progressData.userId,
              lessonId: progressData.lessonId,
              completedSteps: progressData.completedSteps || [],
              accuracy: progressData.accuracy || 0,
              completed: progressData.completed || false,
              duration: progressData.duration || 0,
              mistakes: progressData.mistakes || 0,
              points: progressData.points || 0,
              stars: progressData.stars || 0,
              hintsUsed: progressData.hintsUsed || 0,
              medal: progressData.medal || 'none'
            };
            
            console.log('✅ Previous progress loaded:', this.previousProgress);
          } else {
            console.log('ℹ️ No significant previous progress found');
            this.previousProgress = null;
          }
        } else {
          console.log('ℹ️ No previous progress found for this lesson');
          this.previousProgress = null;
        }
        
      } catch (err) {
        console.warn('⚠️ Failed to load previous progress:', err);
        this.previousProgress = null;
      }
    },

    // AI Methods
    async loadAIUsage() {
      try {
        const usageInfo = await getUserUsage();
        if (usageInfo.success) {
          this.aiUsage = formatUsageDisplay(usageInfo.usage, usageInfo.plan);
          console.log('📊 AI usage loaded:', this.aiUsage);
        }
      } catch (error) {
        console.warn('⚠️ Could not load AI usage:', error);
      }
    },

    generateAISuggestions() {
      this.aiSuggestions = generateLessonSuggestions(this.currentStep, {
        currentStep: this.currentIndex,
        mistakes: this.mistakeCount,
        completedSteps: Array.from({length: this.currentIndex}, (_, i) => i)
      });
      
      this.quickSuggestions = this.aiSuggestions.slice(0, 3);
      console.log('💡 Generated AI suggestions:', this.aiSuggestions);
    },

    async sendAIMessage() {
      if (!this.aiChatInput.trim() || this.aiIsLoading) return;
      
      const userMessage = this.aiChatInput.trim();
      this.aiChatInput = '';
      this.aiIsLoading = true;
      
      this.aiChatHistory.push({
        id: Date.now(),
        type: 'user',
        content: userMessage
      });
      
      try {
        const lessonContext = {
          lessonId: this.lesson._id,
          lessonName: this.lesson.lessonName,
          topic: this.lesson.topic,
          totalSteps: this.steps.length
        };
        
        const userProgress = {
          currentStep: this.currentIndex,
          completedSteps: Array.from({length: this.currentIndex}, (_, i) => i),
          mistakes: this.mistakeCount,
          stars: this.stars,
          elapsedSeconds: this.elapsedSeconds
        };
        
        const stepContext = {
          type: this.currentStep?.type || 'unknown',
          data: this.currentStep?.data
        };
        
        const aiResponse = await getLessonAIResponse(userMessage, lessonContext, userProgress, stepContext);
        
        this.aiChatHistory.push({
          id: Date.now() + 1,
          type: 'ai',
          content: aiResponse
        });
        
        this.generateAISuggestions();
        await this.loadAIUsage();
        
      } catch (error) {
        console.error('❌ AI chat error:', error);
        this.aiChatHistory.push({
          id: Date.now() + 1,
          type: 'ai',
          content: 'Извините, возникла ошибка. Попробуйте снова.'
        });
      } finally {
        this.aiIsLoading = false;
      }
    },

    async askAI(question) {
      this.aiChatInput = question;
      await this.sendAIMessage();
    },

    async sendFloatingAIMessage() {
      if (!this.floatingAIInput.trim() || this.aiIsLoading) return;
      
      this.aiChatInput = this.floatingAIInput;
      this.floatingAIInput = '';
      await this.sendAIMessage();
    },

    toggleFloatingAI() {
      this.showFloatingAI = !this.showFloatingAI;
      if (this.showFloatingAI) {
        this.generateAISuggestions();
      }
    },

    async askAboutExplanation() {
      if (!this.explanationQuestion.trim()) return;
      
      try {
        const explanationText = this.getLocalized(this.currentStep.data);
        const lessonContext = {
          lessonId: this.lesson._id,
          lessonName: this.lesson.lessonName,
          topic: this.lesson.topic
        };
        
        this.explanationAIResponse = await getExplanationHelp(
          explanationText, 
          this.explanationQuestion, 
          lessonContext
        );
        
        this.explanationQuestion = '';
        
      } catch (error) {
        console.error('❌ Explanation help error:', error);
        this.explanationAIResponse = 'Не удалось получить помощь. Попробуйте снова.';
      }
    },

    // Helper Methods
    getStepIcon(stepType) {
      const icons = {
        explanation: '📚',
        example: '💡',
        reading: '📖',
        exercise: '✏️',
        practice: '🧪',
        quiz: '🧩',
        vocabulary: '📝',
        video: '🎬',
        audio: '🎵'
      };
      return icons[stepType] || '📄';
    },

    getStepTypeText(stepType) {
      const texts = {
        explanation: 'Объяснение',
        example: 'Пример',
        reading: 'Чтение',
        exercise: 'Упражнение',
        practice: 'Практика',
        quiz: 'Викторина',
        vocabulary: 'Словарь',
        video: 'Видео',
        audio: 'Аудио'
      };
      return texts[stepType] || 'Контент';
    },

    getMedalIcon() {
      if (this.mistakeCount === 0) return '🥇';
      if (this.mistakeCount <= 2) return '🥈';
      return '🥉';
    },

    formatContent(content) {
      if (!content) return 'Контент недоступен';
      
      // Convert newlines to <br> tags for proper display
      return content.replace(/\n/g, '<br>');
    },

    getLocalized(field) {
      if (typeof field === 'string') return field;
      return (field?.en || field?.ru || field?.uz || '').replace(/^(en|ru|uz):/i, '').trim();
    },

    getStepContent(step) {
      if (!step || !step.data) return 'Контент недоступен';
      
      if (typeof step.data === 'string') return step.data;
      if (step.data.content) return this.getLocalized(step.data.content);
      if (step.data.explanation) return this.getLocalized(step.data.explanation);
      if (step.data.text) return this.getLocalized(step.data.text);
      
      return 'Контент недоступен';
    },

    getExerciseQuestion(step) {
      if (!step || !step.data) return 'Вопрос недоступен';
      
      if (step.data.question) return this.getLocalized(step.data.question);
      if (step.data.text) return this.getLocalized(step.data.text);
      
      return 'Вопрос недоступен';
    },

    getCorrectAnswer(step) {
      if (!step || !step.data) return '';
      
      return step.data.correctAnswer || step.data.answer || '';
    },

    hasOptions(step) {
      return step && step.data && Array.isArray(step.data.options) && step.data.options.length > 0;
    },

    getOptions(step) {
      if (!this.hasOptions(step)) return [];
      return step.data.options;
    },

    getQuizQuestion(step) {
      if (!step || !step.data) return 'Вопрос недоступен';
      return this.getLocalized(step.data.question || step.data.text || '');
    },

    getQuizOptions(step) {
      if (!step || !step.data) return [];
      
      if (Array.isArray(step.data.options)) {
        return step.data.options.map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.text || opt.label || opt.value || '';
        });
      }
      
      return [];
    },

    // Navigation
    goNext() {
      this.userAnswer = '';
      this.confirmation = '';
      this.answerWasCorrect = false;
      this.currentHint = '';
      this.smartHint = '';
      this.explanationAIResponse = '';
      this.showExplanationHelp = false;

      if (this.isLastStep) {
        this.completeLesson();
      } else {
        this.currentIndex++;
        this.generateAISuggestions();
      }
    },

    goPrevious() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.userAnswer = '';
        this.confirmation = '';
        this.answerWasCorrect = false;
        this.currentHint = '';
        this.smartHint = '';
        this.explanationAIResponse = '';
        this.showExplanationHelp = false;
        this.generateAISuggestions();
      }
    },

    // Answer Handling
    async handleSubmitOrNext() {
      const step = this.currentStep;
      if (!step || !step.data) {
        console.warn('⚠️ No current step data available');
        return;
      }

      const correctAnswer = this.getCorrectAnswer(step);
      const userResponse = this.userAnswer.trim().toLowerCase();
      const correctResponseNormalized = correctAnswer.toLowerCase().trim();

      if (!userResponse) {
        this.confirmation = '⚠️ Введите ответ.';
        return;
      }

      if (userResponse === correctResponseNormalized) {
        this.confirmation = '✅ Верно! Отличная работа!';
        this.answerWasCorrect = true;
        this.stars++;
        this.earnedPoints += 10;
        this.currentHint = '';
        this.smartHint = '';
      } else {
        this.confirmation = '❌ Неверно. Попробуйте снова.';
        this.mistakeCount++;
        this.answerWasCorrect = false;
        this.earnedPoints = Math.max(0, this.earnedPoints - 2);

        this.mistakeLog.push({
          stepIndex: this.currentIndex,
          question: this.getExerciseQuestion(step),
          userAnswer: this.userAnswer,
          correctAnswer: correctAnswer,
          hint: step.data.hint || null
        });

        // Generate smart hint after mistakes
        if (this.mistakeCount >= 2) {
          try {
            const lessonContext = {
              lessonId: this.lesson._id,
              lessonName: this.lesson.lessonName,
              topic: this.lesson.topic
            };
            
            this.smartHint = await generateSmartHint(step.data, this.mistakeCount, lessonContext);
            this.hintsUsed = true;
          } catch (error) {
            console.error('❌ Smart hint error:', error);
          }
        }
      }
    },

    showHint() {
      const step = this.currentStep;
      if (step && step.data && step.data.hint) {
        this.currentHint = step.data.hint;
        this.hintsUsed = true;
      } else {
        this.currentHint = 'Подсказка недоступна для этого задания.';
      }
    },

    // Progress Management
    async saveProgress(completed = false) {
      try {
        if (!this.userId || !this.lesson._id) {
          console.error('❌ Missing userId or lessonId for progress save');
          return false;
        }

        const completedSteps = [];
        if (this.started) {
          const maxIndex = Math.min(this.currentIndex, this.steps.length - 1);
          for (let i = 0; i <= maxIndex; i++) {
            completedSteps.push(i);
          }
        }

        const progressPercent = this.steps.length > 0 
          ? Math.floor((completedSteps.length / this.steps.length) * 100) 
          : 0;

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

        console.log('📤 Saving progress:', progressData);

        const result = await submitProgress(this.userId, progressData);
        
        if (result.success) {
          console.log('✅ Progress saved successfully');
          return true;
        } else {
          console.warn('⚠️ Progress save returned success: false');
          return false;
        }
        
      } catch (err) {
        console.error('❌ Progress save error:', err);
        return false;
      }
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

    // Lesson Control
    startLesson() {
      this.started = true;
      this.timerInterval = setInterval(() => this.elapsedSeconds++, 1000);
      this.autosaveTimer = setInterval(() => this.autosaveProgress(), 15000);
      this.generateAISuggestions();
      console.log('🚀 Lesson started');
    },

    continuePreviousProgress() {
      if (this.previousProgress) {
        this.currentIndex = Math.min(
          this.previousProgress.completedSteps.length, 
          this.steps.length - 1
        );
        this.stars = parseInt(this.previousProgress.stars) || 0;
        this.mistakeCount = parseInt(this.previousProgress.mistakes) || 0;
        this.elapsedSeconds = parseInt(this.previousProgress.duration) || 0;
        this.hintsUsed = Boolean(this.previousProgress.hintsUsed);
        this.earnedPoints = parseInt(this.previousProgress.points) || 0;
      }
      this.startLesson();
    },

    async retryLoad() {
      this.retryCount++;
      console.log(`🔄 Retrying lesson load attempt ${this.retryCount}`);
      await this.loadLesson();
    },

    clearTimers() {
      clearInterval(this.timerInterval);
      clearInterval(this.autosaveTimer);
    },

    // Lesson Completion
    async completeLesson() {
      this.clearTimers();
      this.lessonCompleted = true;
      this.showConfetti = true;

      this.earnedPoints = Math.max(0, 100 - this.mistakeCount * 10 + this.stars * 5);

      if (this.mistakeCount === 0) {
        this.medalLabel = '🥇 Золотая медаль - Безупречно!';
      } else if (this.mistakeCount <= 2) {
        this.medalLabel = '🥈 Серебряная медаль - Отлично!';
      } else {
        this.medalLabel = '🥉 Бронзовая медаль - Хорошо!';
      }

      // Generate AI progress insight
      try {
        const lessonContext = {
          lessonId: this.lesson._id,
          lessonName: this.lesson.lessonName,
          topic: this.lesson.topic,
          totalSteps: this.steps.length
        };
        
        const userProgress = {
          completedSteps: Array.from({length: this.steps.length}, (_, i) => i),
          mistakes: this.mistakeCount,
          stars: this.stars,
          elapsedSeconds: this.elapsedSeconds
        };
        
        this.progressInsight = await generateProgressInsight(userProgress, lessonContext);
      } catch (error) {
        console.error('❌ Progress insight error:', error);
        this.progressInsight = 'Отличная работа! Вы успешно завершили урок! 🌟';
      }

      setTimeout(() => this.launchConfetti(), 200);
      await this.saveProgress(true);
    },

    launchConfetti() {
      const canvas = this.$refs.confettiCanvas;
      if (canvas) {
        const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
        myConfetti({ particleCount: 150, spread: 180, origin: { y: 0.6 } });
        setTimeout(() => (this.showConfetti = false), 5000);
      }
    },

    // Modal Handling
    confirmExit() {
      this.showExitModal = true;
    },

    cancelExit() {
      this.showExitModal = false;
    },

    async exitLesson() {
      if (this.started && !this.lessonCompleted) {
        await this.saveProgress(false);
      }
      this.showExitModal = false;
      this.$router.push('/catalogue');
    },

    // Sharing
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
    },

    goToHomework() {
      this.$router.push(`/profile/homeworks/${this.lesson._id}`);
    }
  }
};
</script>

<style scoped>
/* Base Styles */
.lesson-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Loading & Error States */
.loading-screen, .error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-screen h3 {
  font-size: 1.5rem;
  color: #dc2626;
  margin-bottom: 12px;
}

.error-screen p {
  color: #6b7280;
  margin-bottom: 24px;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.retry-btn, .back-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn {
  background: #6366f1;
  color: white;
}

.retry-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

.back-btn {
  background: #f3f4f6;
  color: #374151;
}

.back-btn:hover {
  background: #e5e7eb;
}

/* Modal Styles */
.modal-overlay {
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
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
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
  font-size: 1.25rem;
  color: #1e293b;
}

.modal-content p {
  margin: 0 0 24px 0;
  color: #64748b;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.modal-actions button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.premium-btn, .confirm-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.premium-btn:hover, .confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.cancel-btn {
  background: #f1f5f9;
  color: #64748b;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

/* Intro Screen */
.intro-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  text-align: center;
  position: relative;
}

.exit-btn {
  position: absolute;
  top: 40px;
  right: 40px;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: 1.5rem;
  color: #ef4444;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.intro-content {
  max-width: 600px;
  width: 100%;
}

.lesson-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.lesson-description {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.lesson-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.info-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.info-text {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.previous-progress {
  background: rgba(59, 130, 246, 0.1);
  padding: 24px;
  border-radius: 16px;
  margin: 24px 0;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.previous-progress h4 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 1.1rem;
}

.progress-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
}

.continue-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
}

.intro-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.start-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.3);
}

/* Main Lesson Container */
.lesson-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Lesson Header */
.lesson-header {
  background: white;
  padding: 16px 32px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.exit-btn-small {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  font-size: 1.2rem;
  color: #ef4444;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exit-btn-small:hover {
  background: rgba(239, 68, 68, 0.2);
}

.lesson-header .lesson-title {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0;
  flex-grow: 1;
  min-width: 0;
  text-align: center;
}

.lesson-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
}

.timer-display, .step-counter {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 600;
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 6px;
}

/* Progress Section */
.progress-section {
  background: white;
  padding: 16px 32px;
  border-bottom: 1px solid #e2e8f0;
}

.progress-bar-wrapper {
  position: relative;
  background: #e2e8f0;
  height: 8px;
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: inherit;
  transition: width 0.5s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.85rem;
  color: #64748b;
}

.stars-display {
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 600;
}

/* Split Screen Content */
.split-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 0;
}

/* Content Panel (Left) */
.content-panel {
  background: white;
  padding: 32px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
}

.step-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.step-title {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.step-type-icon {
  font-size: 1.3rem;
}

.step-type-text {
  font-weight: 600;
}

.step-content {
  flex: 1;
  margin-bottom: 24px;
}

/* Text Content */
.text-content {
  line-height: 1.7;
}

.content-text {
  font-size: 1rem;
  color: #374151;
  margin: 0;
}

/* Vocabulary Content */
.vocabulary-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vocabulary-item, .single-vocabulary {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.vocab-term {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.vocab-definition {
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 8px;
  line-height: 1.6;
}

.vocab-example {
  font-size: 0.9rem;
  color: #6b7280;
  font-style: italic;
  padding: 8px 0;
  border-top: 1px solid #e5e7eb;
}

/* Media Content */
.media-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.media-placeholder {
  background: #f8fafc;
  padding: 40px;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  text-align: center;
  max-width: 400px;
}

.media-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.media-placeholder h4 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 1.1rem;
}

.media-placeholder p {
  margin: 0 0 16px 0;
  color: #64748b;
}

.media-url {
  font-size: 0.85rem;
  color: #9ca3af;
  font-family: monospace;
  background: white;
  padding: 8px;
  border-radius: 4px;
}

/* Default Content */
.default-content {
  line-height: 1.7;
}

/* Content Navigation */
.content-navigation {
  display: flex;
  gap: 12px;
  margin-top: auto;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
}

.prev-btn {
  background: #f1f5f9;
  color: #64748b;
}

.prev-btn:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.next-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.help-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  flex: 0 0 auto;
  min-width: 140px;
}

.help-btn:hover, .help-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
}

/* Interactive Panel (Right) */
.interactive-panel {
  background: #f8fafc;
  padding: 32px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Exercise Container */
.exercise-container, .quiz-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.exercise-header, .quiz-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.exercise-title, .quiz-title {
  font-size: 1.2rem;
  color: #1e293b;
  margin: 0;
}

.exercise-content, .quiz-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exercise-question, .quiz-question {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 24px 0;
  line-height: 1.5;
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* Options Grid */
.options-grid, .quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.option-card, .quiz-option-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.option-card:hover, .quiz-option-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
}

.option-card.selected, .quiz-option-card.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.option-card.correct, .quiz-option-card.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.option-card.incorrect, .quiz-option-card.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.option-radio, .quiz-radio {
  display: none;
}

.option-content, .quiz-option-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-letter, .quiz-option-letter {
  background: #e2e8f0;
  color: #374151;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.option-card.selected .option-letter,
.quiz-option-card.selected .quiz-option-letter {
  background: #3b82f6;
  color: white;
}

.option-text, .quiz-option-text {
  font-size: 0.95rem;
  line-height: 1.4;
  flex: 1;
}

/* Text Input */
.text-input-container {
  margin-bottom: 24px;
}

.answer-textarea {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  background: white;
}

.answer-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.answer-textarea:disabled {
  background: #f8fafc;
  color: #9ca3af;
}

/* Smart Hint */
.smart-hint {
  background: rgba(245, 158, 11, 0.1);
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
  border: 1px solid rgba(245, 158, 11, 0.3);
  position: relative;
}

.hint-header {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.hint-content {
  color: #78350f;
  line-height: 1.5;
}

.close-hint-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #92400e;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-hint-btn:hover {
  background: rgba(245, 158, 11, 0.2);
}

/* Feedback */
.feedback {
  margin: 16px 0;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.feedback.correct {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feedback.incorrect {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.feedback-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.feedback-text {
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

/* Action Buttons */
.exercise-actions, .quiz-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  flex-wrap: wrap;
}

.submit-btn, .next-btn, .hint-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
}

.submit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.hint-btn {
  background: #f59e0b;
  color: white;
  flex: 0 0 auto;
}

.hint-btn:hover {
  background: #d97706;
  transform: translateY(-2px);
}

/* Hint Display */
.hint-display {
  margin-top: 16px;
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

.hint-display .hint-header {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.hint-display .hint-content {
  color: #78350f;
  line-height: 1.5;
}

/* AI Help Panel */
.ai-help-panel {
  background: rgba(59, 130, 246, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ai-help-panel h4 {
  margin: 0 0 16px 0;
  color: #1d4ed8;
  font-size: 1.1rem;
}

.ai-help-panel p {
  margin: 0 0 20px 0;
  color: #64748b;
  line-height: 1.5;
}

.quick-suggestions {
  margin-bottom: 16px;
}

.quick-suggestions p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.suggestion-btn, .quick-suggestion-btn {
  background: #e0e7ff;
  color: #3730a3;
  border: none;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  margin: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-btn:hover, .quick-suggestion-btn:hover {
  background: #c7d2fe;
  transform: translateY(-1px);
}

.ai-chat-input {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.ai-chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.ai-chat-input button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.ai-chat-input button:hover:not(:disabled) {
  background: #2563eb;
}

.ai-chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-chat-history {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.chat-message {
  margin-bottom: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 8px;
  border-radius: 6px;
}

.chat-message.user {
  background: #dbeafe;
  color: #1e40af;
}

.chat-message.ai {
  background: #f3f4f6;
  color: #374151;
}

/* Non-interactive Panel */
.non-interactive-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.panel-placeholder {
  background: rgba(148, 163, 184, 0.1);
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 300px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.panel-placeholder h4 {
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 1.1rem;
}

.panel-placeholder p {
  margin: 0;
  color: #9ca3af;
  line-height: 1.5;
}

/* Explanation Help */
.explanation-help {
  background: rgba(139, 92, 246, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin: 16px 0;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.explanation-help h4 {
  margin: 0 0 12px 0;
  color: #6d28d9;
}

.explanation-help-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.explanation-help-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.explanation-help-input button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.explanation-help-input button:hover:not(:disabled) {
  background: #7c3aed;
}

.explanation-help-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-response {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Completion Screen */
.completion-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.completion-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modal-appear 0.5s ease-out;
}

.completion-header {
  margin-bottom: 32px;
}

.completion-title {
  font-size: 2rem;
  color: #1e293b;
  margin: 0 0 24px 0;
}

.medal-section {
  margin-bottom: 24px;
}

.medal-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.medal-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #059669;
}

.completion-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-card .stat-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.progress-insight {
  background: rgba(59, 130, 246, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.progress-insight h4 {
  margin: 0 0 12px 0;
  color: #1d4ed8;
}

.completion-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.primary:hover {
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.action-btn.secondary:hover {
  background: #e2e8f0;
}

/* Floating AI Assistant */
.floating-ai-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  z-index: 1000;
  transition: all 0.3s ease;
}

.floating-ai-btn:hover, .floating-ai-btn.active {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.floating-ai-assistant {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  animation: modal-appear 0.3s ease-out;
}

.ai-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.ai-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #1e293b;
}

.close-ai-btn {
  background: rgba(148, 163, 184, 0.1);
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-ai-btn:hover {
  background: rgba(148, 163, 184, 0.2);
}

.ai-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-display {
  background: #f8fafc;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #64748b;
  text-align: center;
}

.ai-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.chat-input {
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.chat-input button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.chat-input button:hover:not(:disabled) {
  background: #2563eb;
}

/* Confetti Canvas */
.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .split-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .content-panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    min-height: auto;
    max-height: 60vh;
  }
  
  .interactive-panel {
    background: white;
  }
  
  .floating-ai-assistant {
    width: calc(100vw - 32px);
    right: 16px;
    left: 16px;
  }
}

@media (max-width: 768px) {
  .lesson-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .lesson-header .lesson-title {
    font-size: 1.1rem;
    text-align: left;
    order: 2;
  }
  
  .exit-btn-small {
    align-self: flex-end;
    order: 1;
  }
  
  .lesson-meta {
    order: 3;
    align-self: flex-start;
    gap: 12px;
  }
  
  .progress-section {
    padding: 12px 16px;
  }
  
  .content-panel, .interactive-panel {
    padding: 20px 16px;
  }
  
  .intro-screen {
    padding: 20px 16px;
  }
  
  .lesson-title {
    font-size: 2rem;
  }
  
  .lesson-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .progress-stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .completion-content {
    padding: 32px 20px;
  }
  
  .completion-title {
    font-size: 1.5rem;
  }
  
  .completion-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .completion-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .content-navigation, .exercise-actions, .quiz-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .nav-btn, .submit-btn, .next-btn, .hint-btn {
    width: 100%;
    min-width: auto;
  }
  
  .options-grid, .quiz-options {
    gap: 8px;
  }
  
  .option-card, .quiz-option-card {
    padding: 12px;
  }
  
  .modal-content {
    padding: 24px;
    margin: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-actions button {
    width: 100%;
    min-width: auto;
  }
  
  .floating-ai-btn {
    width: 48px;
    height: 48px;
    bottom: 16px;
    right: 16px;
  }
  
  .floating-ai-assistant {
    bottom: 70px;
    max-height: 60vh;
  }
}

@media (max-width: 480px) {
  .lesson-title {
    font-size: 1.5rem;
  }
  
  .lesson-description {
    font-size: 1rem;
  }
  
  .content-panel, .interactive-panel {
    padding: 16px;
  }
  
  .completion-content {
    padding: 24px 16px;
  }
  
  .completion-title {
    font-size: 1.25rem;
  }
  
  .medal-icon {
    font-size: 3rem;
  }
  
  .completion-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-card .stat-value {
    font-size: 1.25rem;
  }
  
  .floating-ai-assistant {
    width: calc(100vw - 16px);
    right: 8px;
    left: 8px;
    bottom: 60px;
    max-height: 50vh;
  }
  
  .ai-header {
    padding: 12px;
  }
  
  .ai-body {
    padding: 12px;
  }
  
  .chat-message {
    font-size: 0.8rem;
    padding: 6px 8px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .lesson-page {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #e2e8f0;
  }
  
  .content-panel, .interactive-panel, .lesson-header, .progress-section {
    background: #334155;
    border-color: #475569;
  }
  
  .modal-content, .completion-content {
    background: #334155;
    color: #e2e8f0;
  }
  
  .option-card, .quiz-option-card {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }
  
  .answer-textarea {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }
  
  .content-text, .exercise-question, .quiz-question {
    color: #e2e8f0;
  }
  
  .stat-card, .info-card {
    background: #475569;
    border-color: #64748b;
  }
  
  .floating-ai-assistant {
    background: #334155;
    color: #e2e8f0;
  }
  
  .ai-header {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    color: #e2e8f0;
  }
  
  .vocab-term, .vocab-definition {
    color: #e2e8f0;
  }
  
  .vocabulary-item, .single-vocabulary {
    background: #475569;
    border-color: #64748b;
  }
}

/* Print Styles */
@media print {
  .exit-btn,
  .exit-btn-small,
  .modal-overlay,
  .floating-ai-btn,
  .floating-ai-assistant {
    display: none !important;
  }
  
  .split-content {
    grid-template-columns: 1fr;
  }
  
  .content-panel, .interactive-panel {
    border: none;
    box-shadow: none;
  }
  
  * {
    background: white !important;
    color: black !important;
  }
}

/* Focus Management */
.nav-btn:focus,
.submit-btn:focus,
.next-btn:focus,
.option-radio:focus,
.quiz-radio:focus,
.answer-textarea:focus,
.exit-btn:focus,
.exit-btn-small:focus,
.floating-ai-btn:focus,
.close-ai-btn:focus {
  outline: 3px solid #4f46e5;
  outline-offset: 2px;
}

/* Accessibility Enhancements */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Smooth Transitions */
.lesson-page * {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced Button States */
.nav-btn:active,
.submit-btn:active,
.next-btn:active,
.action-btn:active {
  transform: translateY(0) scale(0.98);
}

/* Custom Scrollbar */
.step-content::-webkit-scrollbar,
.exercise-content::-webkit-scrollbar,
.quiz-content::-webkit-scrollbar,
.ai-chat-history::-webkit-scrollbar,
.ai-body::-webkit-scrollbar {
  width: 6px;
}

.step-content::-webkit-scrollbar-track,
.exercise-content::-webkit-scrollbar-track,
.quiz-content::-webkit-scrollbar-track,
.ai-chat-history::-webkit-scrollbar-track,
.ai-body::-webkit-scrollbar-track {
  background: transparent;
}

.step-content::-webkit-scrollbar-thumb,
.exercise-content::-webkit-scrollbar-thumb,
.quiz-content::-webkit-scrollbar-thumb,
.ai-chat-history::-webkit-scrollbar-thumb,
.ai-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}

.step-content::-webkit-scrollbar-thumb:hover,
.exercise-content::-webkit-scrollbar-thumb:hover,
.quiz-content::-webkit-scrollbar-thumb:hover,
.ai-chat-history::-webkit-scrollbar-thumb:hover,
.ai-body::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}

/* Animation for step transitions */
.step-content {
  animation: stepFadeIn 0.3s ease-out;
}

@keyframes stepFadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .option-card,
  .quiz-option-card {
    min-height: 44px;
  }
  
  .nav-btn,
  .submit-btn,
  .next-btn,
  .hint-btn {
    min-height: 44px;
  }
  
  .exit-btn,
  .exit-btn-small {
    min-width: 44px;
    min-height: 44px;
  }
  
  .floating-ai-btn {
    min-width: 56px;
    min-height: 56px;
  }
  
  .close-ai-btn {
    min-width: 44px;
    min-height: 44px;
  }
}

/* Performance optimizations */
.lesson-page {
  will-change: auto;
  contain: layout style paint;
}

.progress-bar {
  will-change: width;
}

.loading-spinner {
  will-change: transform;
}
</style>