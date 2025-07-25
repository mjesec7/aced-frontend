<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Загрузка информации о курсе...</p>
    </div>

    <div v-else-if="!topic || error" class="error-container">
      <div class="error-icon">❌</div>
      <h3 class="error-title">
        {{ topic ? 'Произошла ошибка' : 'Тема не найдена' }}
      </h3>
      <p class="error-message">
        {{ topic ? error : 'Возможно, тема была удалена или у вас нет к ней доступа' }}
      </p>
      <button @click="navigateToProfile" class="btn btn-back">
        ⬅️ Назад к каталогу
      </button>
      <div v-if="isDevelopment && debugInfo" class="debug-info">
        <h4>Debug Info (Dev Mode Only):</h4>
        <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
      </div>
    </div>

    <div v-else class="topic-content">
      <div class="nav-header">
        <button @click="navigateToProfile" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад к каталогу
        </button>
      </div>

      <div class="topic-header">
        <div class="topic-hero">
          <div class="topic-icon">📘</div>
          <div class="topic-info">
            <h1 class="topic-title">{{ getTopicName(topic) }}</h1>
            <p class="topic-description">{{ getTopicDescription(topic) }}</p>
          </div>
        </div>

        <div class="topic-stats">
          <div class="stat-card">
            <div class="stat-number">{{ lessons.length }}</div>
            <div class="stat-label">Всего уроков</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ freeCount }}</div>
            <div class="stat-label">Бесплатных</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ premiumCount }}</div>
            <div class="stat-label">Премиум</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ reactiveAvailableCount }}</div>
            <div class="stat-label">Доступных</div>
          </div>
        </div>
      </div>

      <div class="lessons-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📚</span>
            Уроки курса
          </h2>
          <div class="lesson-filters">
            <button 
              :class="['filter-btn', { active: filter === 'all' }]"
              @click="filter = 'all'"
            >
              Все ({{ lessons.length }})
            </button>
            <button 
              :class="['filter-btn', { active: filter === 'free' }]"
              @click="filter = 'free'"
            >
              Бесплатные ({{ freeCount }})
            </button>
            <button 
              :class="['filter-btn', { active: filter === 'premium' }]"
              @click="filter = 'premium'"
            >
              Премиум ({{ premiumCount }})
            </button>
          </div>
        </div>

        <div v-if="filteredLessons.length === 0" class="no-lessons">
          <div class="no-lessons-icon">📭</div>
          <h3 class="no-lessons-title">Уроки не найдены</h3>
          <p class="no-lessons-text">
            {{ filter !== 'all' ? 'Попробуйте изменить фильтр' : 'В этой теме пока нет уроков' }}
          </p>
        </div>

        <div v-else class="lessons-grid">
          <div
            v-for="(lesson, index) in filteredLessons"
            :key="lesson._id"
            class="lesson-card"
            :class="{ 
              locked: lesson.type === 'premium' && !isPremiumUser,
              premium: lesson.type === 'premium'
            }"
            @click="startLesson(lesson)"
          >
            <div class="lesson-number">{{ index + 1 }}</div>

            <div class="lesson-badge" :class="lesson.type">
              <span v-if="lesson.type === 'premium'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10H20V20H4V10H6ZM8 10H16V8C16 6.89543 15.1046 6 14 6H10C8.89543 6 8 6.89543 8 8V10Z"/>
                </svg>
                Премиум
              </span>
              <span v-else>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                </svg>
                Бесплатно
              </span>
            </div>

            <div class="lesson-content">
              <h3 class="lesson-title">{{ getLessonName(lesson) }}</h3>
              <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>

              <div class="lesson-meta">
                <span v-if="lesson.steps?.length" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z"/>
                  </svg>
                  {{ lesson.steps.length }} шагов
                </span>
                <span v-if="lesson.metadata?.estimatedDuration" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ lesson.metadata.estimatedDuration }} мин
                </span>
                <span v-if="lesson.homework?.totalExercises > 0" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  {{ lesson.homework.totalExercises }} заданий
                </span>
              </div>
            </div>

            <div class="lesson-action">
              <button 
                class="action-btn"
                :class="{ 
                  locked: lesson.type === 'premium' && !isPremiumUser,
                  premium: lesson.type === 'premium' && !isPremiumUser
                }"
                :disabled="lesson.type === 'premium' && !isPremiumUser"
                @click.stop="startLesson(lesson)"
              >
                <span v-if="lesson.type === 'premium' && !isPremiumUser">
                  🔒 Требуется подписка
                </span>
                <span v-else>
                  🚀 Начать урок
                </span>
              </button>
            </div>

            <div v-if="lesson.type === 'premium' && !isPremiumUser" class="lock-overlay">
              <div class="lock-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10H20V20H4V10H6ZM8 10H16V8C16 6.89543 15.1046 6 14 6H10C8.89543 6 8 6.89543 8 8V10Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-section">
        <div class="action-content">
          <h3 class="action-title">Готовы начать обучение?</h3>
          <p class="action-description">
            {{ reactiveAvailableCount > 0 
              ? `У вас есть доступ к ${reactiveAvailableCount} урокам из ${lessons.length}` 
              : 'Оформите подписку для доступа ко всем урокам'
            }}
          </p>
          <div class="action-buttons">
            <button 
              v-if="reactiveAvailableCount > 0"
              @click="startFirstLesson" 
              class="btn btn-primary btn-start"
            >
              🚀 Начать первый урок
            </button>
            <button 
              v-else
              @click="handleSubscription" 
              class="btn btn-premium btn-start"
            >
              ⭐ Оформить подписку
            </button>
            <button 
              @click="navigateToProfile" 
              class="btn btn-secondary"
            >
              📚 Другие курсы
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { getTopicById, getLessonsByTopic, getUserStatus } from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: null,
      lessons: [],
      loading: true,
      lessonsLoading: false,
      userPlan: 'free', // Initial local state, will be updated by computed/store
      filter: 'all',
      error: null,
      retryCount: 0,
      showDebugInfo: false,
      debugInfo: null,
      lastApiResponse: null, // For debugging API responses

      // ✅ ENHANCED: Add comprehensive reactivity tracking
      componentKey: 0,
      lastUpdateTime: Date.now(),
      eventCleanupFunctions: [],
      globalEventHandlers: {},
      statusChangeTimeout: null,
      
      // ✅ NEW: Status tracking
      lastStatusSync: Date.now(),
      statusSyncInterval: null,
      userStatusOverride: null, // For manual status override in dev mode
      
      // ✅ NEW: Payment tracking
      paymentCheckInterval: null,
      lastPaymentCheck: Date.now(),
      storeUnsubscribe: null, // For Vuex store subscription cleanup
    };
  },
  
  computed: {
    // These are from original code, kept for consistency
    filteredLessons() {
      if (this.filter === 'all') return this.lessons;
      return this.lessons.filter(lesson => lesson.type === this.filter);
    },
    
    freeCount() {
      return this.lessons.filter(lesson => lesson.type !== 'premium').length;
    },
    
    premiumCount() {
      return this.lessons.filter(lesson => lesson.type === 'premium').length;
    },
    
    // Original availableCount - will be overridden by reactiveAvailableCount
    // availableCount() {
    //   return this.lessons.filter(lesson => 
    //     lesson.type !== 'premium' || this.isPremiumUser
    //   ).length;
    // },
    
    // Original isPremiumUser - will be overridden by enhancedIsPremiumUser
    // isPremiumUser() {
    //   const premiumPlans = ['premium', 'start', 'pro'];
    //   return premiumPlans.includes(this.userPlan) || 
    //          premiumPlans.includes(this.getUserSubscription());
    // },
    
    currentUser() {
      return auth.currentUser;
    },
    
    isDevelopment() {
      return import.meta.env.MODE === 'development';
    },

    // ✅ NEW: Enhanced user plan with store integration
    enhancedUserPlan() {
      // Check multiple sources for user plan with priority
      // 1. Manual override (for debugging/testing)
      // 2. Vuex store's userStatus getter
      // 3. localStorage 'userStatus' item
      // 4. Component's local `userPlan` data property
      // 5. Default to 'free'
      const storePlan = this.$store?.getters?.['user/userStatus'];
      const localPlan = localStorage.getItem('userStatus');
      const componentPlan = this.userPlan;
      const overridePlan = this.userStatusOverride; // For dev/testing
      
      // Forces reactivity of this computed property by depending on these:
      const forceReactivityFromCounter = this.$store?.getters?.['user/forceUpdateCounter'];
      const forceReactivityFromUpdateTime = this.lastUpdateTime; 
      const forceReactivityFromSyncTime = this.lastStatusSync;

      const finalPlan = overridePlan || storePlan || localPlan || componentPlan || 'free';
      
      console.log('📊 TopicOverview: Computing enhanced user plan:', {
        store: storePlan,
        local: localPlan,
        component: componentPlan,
        override: overridePlan,
        final: finalPlan,
        _reactivityTriggers: {
          forceReactivityFromCounter,
          forceReactivityFromUpdateTime,
          forceReactivityFromSyncTime
        }
      });
      
      return finalPlan;
    },
    
    // ✅ ENHANCED: Better premium user check based on enhancedUserPlan
    isPremiumUser() {
      const plan = this.enhancedUserPlan;
      const premiumPlans = ['premium', 'start', 'pro'];
      const isPremium = premiumPlans.includes(plan);
      
      console.log('📊 TopicOverview: Checking premium status:', { plan, isPremium });
      
      return isPremium;
    },
    
    // ✅ NEW: Reactive available count based on current plan
    reactiveAvailableCount() {
      // This getter now correctly depends on `this.lessons` and `this.isPremiumUser`
      // `this.isPremiumUser` itself depends on `enhancedUserPlan`, which is highly reactive.
      // `this.lessons` is updated by `loadLessonsForTopic`, also triggering reactivity.
      return this.lessons.filter(lesson => 
        lesson && (lesson.type !== 'premium' || this.isPremiumUser)
      ).length;
    },
    
    // ✅ NEW: User status label for display (useful for debugging or UI element)
    userStatusLabel() {
      const plan = this.enhancedUserPlan;
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'premium': 'Start', // Alias for 'start'
        'free': 'Free'
      };
      return labels[plan] || 'Free';
    }
  },
  
  // ✅ ADD WATCHERS TO YOUR EXISTING WATCH SECTION
  watch: {
    // Watch for changes in the `enhancedUserPlan` computed property.
    // This will react to changes in Vuex, localStorage, or local data.
    enhancedUserPlan: {
      handler(newPlan, oldPlan) {
        if (newPlan !== oldPlan) {
          console.log('📊 TopicOverview: Enhanced user plan changed:', oldPlan, '→', newPlan);
          // When the effective plan changes, trigger a UI update.
          this.triggerReactivityUpdate();
        }
      },
      immediate: true // Run handler immediately on component creation
    },
    
    // Watch directly for Vuex store's user status changes.
    // This provides a direct, immediate reaction to store mutations.
    '$store.getters["user/userStatus"]': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log('📊 TopicOverview: Store user status changed:', oldStatus, '→', newStatus);
          // Update the local `userPlan` data property to keep it in sync.
          this.userPlan = newStatus || 'free';
          // Trigger a full reactivity update.
          this.triggerReactivityUpdate();
        }
      },
      immediate: true // Run handler immediately on component creation
    }
    // Existing watchers like `filter` do not need to be explicitly added here
    // as they are part of computed properties or local data reactivity.
  },
  
  async mounted() {
    console.log('📱 TopicOverview: Component mounted');
    
    try {
      // Initialize component (authentication, load data, etc.)
      await this.initializeComponent();
      
      // ✅ NEW: Setup comprehensive event listeners (for global state changes)
      this.setupEventListeners();
      
      // ✅ NEW: Setup periodic checks (for payment status, general sync)
      this.setupPeriodicChecks();
      
      console.log('✅ TopicOverview: Component mounted successfully');
      
    } catch (error) {
      console.error('❌ TopicOverview: Mount error:', error);
      // If a critical error occurs during mount, ensure loading is false
      this.loading = false; 
    }
  },
  
  methods: {
    // ✅ NEW: Navigate to profile catalogue method
    navigateToProfile() {
      try {
        console.log('🔄 Navigating to profile catalogue');
        this.$router.push({ name: 'CataloguePage' });
      } catch (error) {
        console.error('❌ Error navigating to profile:', error);
        // Fallback to direct URL if router fails
        this.$router.push('/profile/catalogue');
      }
    },

    // ✅ COMPLETELY FIXED: Robust initialization with comprehensive error handling
    async initializeComponent() {
      try {
        this.loading = true; // Set loading true at the start of initialization
        this.error = null; // Clear any previous errors
        this.retryCount = 0; // Reset retry count
        this.topic = null; // Clear previous topic data
        this.lessons = []; // Clear previous lessons

        console.log('🚀 Initializing TopicOverview component...');
        console.log('📍 Route params:', this.$route.params);
        console.log('📍 Environment:', import.meta.env.MODE);
        
        // Step 1: Wait for authentication if needed (with timeout)
        await this.waitForAuth();
        
        // Step 2: Load user subscription status
        await this.loadUserPlan();
        
        // Step 3: Load topic data and its lessons
        await this.loadTopicData();
        
        console.log('✅ Component initialization complete');
        
      } catch (error) {
        console.error('❌ Component initialization failed:', error);
        this.error = this.handleError(error, 'инициализация компонента');
        this.loading = false;
        this.topic = null; // Ensure topic is null on failure
        this.lessons = []; // Ensure lessons are empty on failure
        
        // Store debug info for development
        if (this.isDevelopment) {
          this.debugInfo = {
            error: error.message,
            stack: error.stack,
            routeParams: this.$route.params,
            timestamp: new Date().toISOString(),
            // Add more context if available, e.g., this.lastApiResponse
          };
        }
      } finally {
        this.loading = false; // Ensure loading is set to false whether success or failure
      }
    },
    
    // ✅ FIXED: Enhanced authentication waiting with timeout
    async waitForAuth() {
      if (auth.currentUser) {
        console.log('✅ User already authenticated:', auth.currentUser.uid);
        return;
      }
      
      console.log('⏳ Waiting for authentication...');
      
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe(); // Unsubscribe immediately after first state change
          if (user) {
            console.log('✅ User authenticated:', user.uid);
          } else {
            console.log('ℹ️ No user authentication (continuing as guest)');
          }
          resolve(); // Resolve the promise regardless of user presence
        });
        
        // Set a timeout to resolve the promise even if auth state doesn't change quickly.
        // This prevents the component from hanging indefinitely.
        setTimeout(() => {
          // If auth state hasn't changed by timeout, ensure we still unsubscribe.
          // Calling unsubscribe multiple times is safe.
          unsubscribe(); 
          console.log('⏰ Authentication wait timeout (continuing anyway)');
          resolve(); // Resolve to allow the component to proceed
        }, 3000); // 3-second timeout
      });
    },
    
    // ✅ COMPLETELY REWRITTEN: Robust topic data loading with comprehensive error handling
    async loadTopicData() {
      const topicId = this.$route.params.id;

      if (!topicId) {
        this.error = 'ID темы не указан в URL';
        this.loading = false; // Ensure loading is false
        return;
      }

      try {
        this.loading = true; // Set loading state specifically for topic data
        this.error = null; // Clear any previous errors
        
        console.log('🔍 Loading topic data for ID:', topicId);
        
        // ✅ ENHANCED: Load topic information with comprehensive error handling
        const topicResult = await getTopicById(topicId);
        
        console.log('📘 Raw topic API response:', topicResult);
        this.lastApiResponse = topicResult; // Store raw response for debugging
        
        // ✅ CRITICAL FIX: Handle ALL possible API response structures for topic data
        let topicData = null;
        let responseFormat = 'unknown';
        
        if (topicResult) {
          // Priority 1: Check for `success` and `data` properties (common API wrapper)
          if (topicResult.success === true && topicResult.data) {
            topicData = topicResult.data;
            responseFormat = 'success_wrapper';
          }
          // Priority 2: Check for `exists` and `data` properties (another common wrapper)
          else if (topicResult.exists === true && topicResult.data) {
            topicData = topicResult.data;
            responseFormat = 'exists_wrapper';
          }
          // Priority 3: Check if the response itself is the topic object (e.g., direct return)
          else if (topicResult._id || topicResult.id || topicResult.name || topicResult.topicName) {
            topicData = topicResult;
            responseFormat = 'direct_object';
          }
          // Priority 4: Check if data is nested directly without `success` flag
          else if (topicResult.data && (topicResult.data._id || topicResult.data.id || topicResult.data.name || topicResult.data.topicName)) {
            topicData = topicResult.data;
            responseFormat = 'nested_data';
          }
          // Priority 5: Handle explicit error response from API
          else if (topicResult.success === false || topicResult.error) {
            const errorMsg = topicResult.message || topicResult.error || 'API returned an error for topic data.';
            throw new Error(`API Error: ${errorMsg}`);
          }
        }
        
        // ✅ VALIDATION: After attempting to extract, check if we actually got valid topic data
        if (!topicData || !topicData._id && !topicData.id) { // A topic must at least have an ID
          console.error('❌ No valid topic data found in response after parsing:', topicResult);
          
          // Enhanced error messaging for debugging in development mode
          if (this.isDevelopment) {
            this.debugInfo = {
              message: 'No valid topic data found in response',
              response: topicResult,
              topicId: topicId,
              responseFormat: responseFormat,
              timestamp: new Date().toISOString()
            };
          }
          throw new Error('Invalid topic data received from server. Please try again.');
        }
        
        // ✅ NORMALIZATION: Ensure consistent topic data structure for component usage
        this.topic = this.normalizeTopicData(topicData);
        
        console.log('✅ Topic loaded and normalized:', this.topic);

        // ✅ ENHANCED: Load lessons for this topic immediately after topic data is successful
        await this.loadLessonsForTopic(this.topic._id || this.topic.id);
        
      } catch (err) {
        console.error('❌ Error loading topic data:', err);
        
        // ✅ ENHANCED: Specific error handling with user-friendly messages
        this.error = this.handleError(err, 'загрузка темы');
        this.topic = null; // Clear topic on error
        this.lessons = []; // Clear lessons on error
        
        // Store detailed debug info for development mode
        if (this.isDevelopment) {
          this.debugInfo = {
            error: err.message,
            response: this.lastApiResponse, // The raw API response
            topicId: topicId,
            stack: err.stack,
            timestamp: new Date().toISOString()
          };
        }
        
      } finally {
        this.loading = false; // Ensure loading is false when done (success or failure)
      }
    },
    
    // ✅ NEW: Separate method for loading lessons with comprehensive error handling
    async loadLessonsForTopic(topicId) {
      if (!topicId) {
        console.warn('⚠️ No topicId provided to load lessons.');
        this.lessons = [];
        return;
      }

      try {
        this.lessonsLoading = true; // Set loading state for lessons
        console.log('📚 Loading lessons for topic:', topicId);
        
        const lessonsResult = await getLessonsByTopic(topicId);
        console.log('📚 Raw lessons API response:', lessonsResult);
        
        // ✅ ENHANCED: Handle different lesson response structures
        let lessonsData = [];
        let lessonsFormat = 'unknown';
        
        if (lessonsResult) {
          if (lessonsResult.success === true && Array.isArray(lessonsResult.data)) {
            lessonsData = lessonsResult.data;
            lessonsFormat = 'success_data_array';
          } else if (lessonsResult.success === true && Array.isArray(lessonsResult.lessons)) {
            lessonsData = lessonsResult.lessons;
            lessonsFormat = 'success_lessons_array';
          } else if (Array.isArray(lessonsResult.data)) { // Check .data property if not explicitly `success: true`
            lessonsData = lessonsResult.data;
            lessonsFormat = 'nested_data_array';
          } else if (Array.isArray(lessonsResult.lessons)) { // Check .lessons property
            lessonsData = lessonsResult.lessons;
            lessonsFormat = 'nested_lessons_array';
          } else if (Array.isArray(lessonsResult)) { // Direct array response
            lessonsData = lessonsResult;
            lessonsFormat = 'direct_array';
          } else if (lessonsResult.success === false) {
            console.warn('⚠️ Lessons API returned error:', lessonsResult.message || lessonsResult.error);
            lessonsData = []; // Treat as no lessons on API error
            lessonsFormat = 'error_response';
          }
        }
        
        console.log(`📚 Found ${lessonsData.length} lessons (format: ${lessonsFormat})`);
        
        // ✅ NORMALIZATION: Ensure lessons have proper structure
        this.lessons = lessonsData
          .map((lesson, index) => this.normalizeLessonData(lesson, topicId, index))
          .filter(lesson => lesson !== null); // Filter out any nulls from normalization failure
        
        console.log('✅ Lessons loaded and normalized:', this.lessons.length);
        
      } catch (lessonError) {
        console.error('❌ Error loading lessons:', lessonError);
        // Don't fail the whole component if lessons fail; display topic info without lessons
        this.lessons = [];
        
        // Show warning to user if possible (e.g., via a toast or an alert in production)
        console.warn('⚠️ Lessons for this topic could not be loaded. Please try again later.');
        
        // Store lesson error for debugging in development mode
        if (this.isDevelopment) {
          this.debugInfo = {
            ...this.debugInfo,
            lessonLoadError: lessonError.message,
            lessonLoadStack: lessonError.stack,
            lessonsApiResponse: this.lastApiResponse // Potentially the topic response, if no specific lesson API response was stored
          };
        }
      } finally {
        this.lessonsLoading = false; // Ensure lessons loading state is false
      }
    },
    
    // ✅ NEW: Topic data normalization function
    normalizeTopicData(rawData) {
      if (!rawData) {
        console.warn('Normalization: Raw topic data is null/undefined.');
        return null;
      }
      
      const normalized = {
        _id: rawData._id || rawData.id, // Prefer _id, fallback to id
        id: rawData.id || rawData._id,   // Ensure both are present if possible
        
        name: this.extractName(rawData),
        topicName: this.extractName(rawData), // Redundant, but ensures compatibility
        
        description: this.extractDescription(rawData),
        topicDescription: this.extractDescription(rawData), // Redundant
        
        subject: rawData.subject || 'General',
        level: rawData.level || 1,
        type: rawData.type || 'free', // Default to 'free' if not specified
        
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
        
        metadata: rawData.metadata || {},
        isActive: rawData.isActive !== undefined ? rawData.isActive : true,
        isDraft: rawData.isDraft || false,
        
        // Store raw data for debugging in development mode
        _raw: this.isDevelopment ? rawData : undefined
      };

      // Basic validation for critical fields
      if (!normalized._id && !normalized.id) {
          console.error('Normalization: Topic data missing a valid ID:', rawData);
          return null; // Indicate failure to normalize
      }
      if (!normalized.name || normalized.name === 'Без названия') {
          console.warn('Normalization: Topic name could not be extracted:', rawData);
          normalized.name = `Тема ${normalized._id?.substring(0, 8) || ''}`;
      }

      return normalized;
    },
    
    // ✅ NEW: Lesson data normalization function
    normalizeLessonData(rawLesson, topicId, index) {
      if (!rawLesson) {
        console.warn(`Normalization: Raw lesson data at index ${index} is null/undefined.`);
        return null;
      }

      const normalized = {
        _id: rawLesson._id || rawLesson.id || `lesson_fallback_${topicId}_${index}`, // Generate fallback ID
        id: rawLesson.id || rawLesson._id || `lesson_fallback_${topicId}_${index}`,
        
        lessonName: this.extractLessonName(rawLesson),
        title: this.extractLessonName(rawLesson),
        name: this.extractLessonName(rawLesson), // For common name access
        
        description: this.extractLessonDescription(rawLesson),
        desc: this.extractLessonDescription(rawLesson), // Redundant
        
        type: rawLesson.type || 'free',
        
        topicId: rawLesson.topicId || topicId, // Ensure lesson links back to its topic
        topic: rawLesson.topic || this.topic?.name || 'Unknown Topic', // Lesson's associated topic name/object
        
        steps: Array.isArray(rawLesson.steps) ? rawLesson.steps : [],
        metadata: rawLesson.metadata || { estimatedDuration: 30 }, // Default duration
        homework: rawLesson.homework || { totalExercises: 0 },
        
        isActive: rawLesson.isActive !== undefined ? rawLesson.isActive : true,
        isDraft: rawLesson.isDraft || false,
        
        // Store raw data for debugging in development mode
        _raw: this.isDevelopment ? rawLesson : undefined
      };

      // Basic validation
      if (!normalized.lessonName || normalized.lessonName === 'Без названия') {
          console.warn(`Normalization: Lesson name could not be extracted for lesson at index ${index}.`);
          normalized.lessonName = `Урок ${index + 1} (${normalized._id.substring(0, 8)})`;
      }

      return normalized;
    },
    
    // ✅ ENHANCED: Name extraction with fallbacks
    extractName(data) {
      if (!data) return 'Без названия';
      
      // Try string `name` property
      if (typeof data.name === 'string' && data.name.trim()) {
        return data.name.trim();
      }
      
      // Try localized `name` object (e.g., { en: 'Name', ru: 'Имя' })
      if (typeof data.name === 'object' && data.name !== null) {
        // Prioritize current language, then English, then Russian, then Uzbek, then any first string value
        const localized = data.name[this.lang] || data.name.en || data.name.ru || data.name.uz;
        if (localized && typeof localized === 'string' && localized.trim()) {
          return localized.trim();
        }
        
        // Fallback: Get the first non-empty string value from the object
        const values = Object.values(data.name);
        for (const value of values) {
          if (value && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
      
      // Try other common name fields (string or localized object)
      const nameFields = ['topicName', 'title', 'displayName', 'topic']; // 'topic' can sometimes be the topic name
      for (const field of nameFields) {
        if (typeof data[field] === 'string' && data[field].trim()) {
          return data[field].trim();
        }
        if (typeof data[field] === 'object' && data[field] !== null) {
          const localized = data[field][this.lang] || data[field].en || data[field].ru || data[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }
      
      // Final fallback
      return 'Без названия';
    },
    
    // ✅ ENHANCED: Description extraction with fallbacks
    extractDescription(data) {
      if (!data) return 'Нет описания';
      
      // Try string `description` property
      if (typeof data.description === 'string' && data.description.trim()) {
        return data.description.trim();
      }
      
      // Try localized `description` object
      if (typeof data.description === 'object' && data.description !== null) {
        const localized = data.description[this.lang] || data.description.en || data.description.ru || data.description.uz;
        if (localized && typeof localized === 'string' && localized.trim()) {
          return localized.trim();
        }
        
        // Fallback: Get the first non-empty string value from the object
        const values = Object.values(data.description);
        for (const value of values) {
          if (value && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
      
      // Try other common description fields
      const descFields = ['topicDescription', 'desc', 'summary', 'info'];
      for (const field of descFields) {
        if (typeof data[field] === 'string' && data[field].trim()) {
          return data[field].trim();
        }
        if (typeof data[field] === 'object' && data[field] !== null) {
          const localized = data[field][this.lang] || data[field].en || data[field].ru || data[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }
      
      return 'Нет описания для этой темы.';
    },
    
    // ✅ ENHANCED: Lesson name extraction with more robust checks
    extractLessonName(lesson) {
      if (!lesson) return 'Без названия';
      
      // Prioritize lessonName, then title, then general name
      const nameFields = ['lessonName', 'title', 'name'];
      
      for (const field of nameFields) {
        if (typeof lesson[field] === 'string' && lesson[field].trim()) {
          return lesson[field].trim();
        }
        // Check for localized object versions of these fields
        if (typeof lesson[field] === 'object' && lesson[field] !== null) {
          const localized = lesson[field][this.lang] || lesson[field].en || lesson[field].ru || lesson[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }

      // Check if `topic` field (which might be the lesson's actual name in some APIs) is a string
      if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
      }
      // Check for localized `topic` object
      if (typeof lesson.topic === 'object' && lesson.topic !== null) {
          const localizedTopic = lesson.topic[this.lang] || lesson.topic.en || lesson.topic.ru || lesson.topic.uz;
          if (localizedTopic && typeof localizedTopic === 'string' && localizedTopic.trim()) {
              return localizedTopic.trim();
          }
      }
      
      return 'Без названия';
    },
    
    // ✅ ENHANCED: Lesson description extraction with more robust checks
    extractLessonDescription(lesson) {
      if (!lesson) return '';
      
      const descFields = ['description', 'desc', 'summary', 'info'];
      
      for (const field of descFields) {
        if (typeof lesson[field] === 'string' && lesson[field].trim()) {
          return lesson[field].trim();
        }
        // Check for localized object versions of these fields
        if (typeof lesson[field] === 'object' && lesson[field] !== null) {
          const localized = lesson[field][this.lang] || lesson[field].en || lesson[field].ru || lesson[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }
      
      return '';
    },
    
    // ✅ ENHANCED: User plan loading from multiple reliable sources
    async loadUserPlan() {
      try {
        console.log('👤 TopicOverview: Loading user plan...');
        
        // 1. Prioritize store's status (most reactive and reliable if kept updated)
        const storeStatus = this.$store?.getters?.['user/userStatus'];
        if (storeStatus && ['premium', 'start', 'pro', 'free'].includes(storeStatus)) {
          this.userPlan = storeStatus;
          console.log('✅ User plan loaded from store:', this.userPlan);
          return;
        }
        
        // 2. Fallback to localStorage
        const localStatus = localStorage.getItem('userStatus');
        if (localStatus && ['premium', 'start', 'pro', 'free'].includes(localStatus)) {
          this.userPlan = localStatus;
          // Optionally, dispatch to store if store was empty
          if (!storeStatus) {
            this.$store.commit('user/SET_USER_STATUS', localStatus); 
          }
          console.log('✅ User plan loaded from localStorage:', this.userPlan);
          return;
        }
        
        // 3. Fallback to API call if user is authenticated and no local/store plan is found
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          console.log('👤 Loading user plan from API for:', userId);

          try {
            const statusResult = await getUserStatus(userId);
            
            if (statusResult && statusResult.success) {
              const apiPlan = statusResult.status || statusResult.data?.subscriptionPlan || 'free';
              this.userPlan = apiPlan;
              localStorage.setItem('userStatus', apiPlan); // Update localStorage
              this.$store.commit('user/SET_USER_STATUS', apiPlan); // Update store
              console.log('✅ User plan loaded from API:', this.userPlan);
              return;
            } else {
              console.warn('⚠️ API returned no success or data for user status. Defaulting to free.');
            }
          } catch (apiError) {
            console.warn('⚠️ API error loading user status:', apiError.message, 'Defaulting to free.');
          }
        }
        
        // 4. Final fallback to 'free' if no plan is determined
        this.userPlan = 'free';
        localStorage.setItem('userStatus', 'free');
        this.$store.commit('user/SET_USER_STATUS', 'free');
        console.log('ℹ️ Defaulting to free plan as no other plan found.');
        
      } catch (err) {
        console.warn('⚠️ Critical error in loadUserPlan:', err.message, 'Defaulting to free.');
        this.userPlan = 'free';
      }
    },

    // ✅ ENHANCED: Get user subscription from multiple sources (used by old `isPremiumUser` if not replaced)
    getUserSubscription() {
      // This method is primarily kept for compatibility if old code still uses it.
      // The `enhancedUserPlan` computed property is the preferred way to get the current plan.
      return this.enhancedUserPlan;
    },
    
    // ✅ COMPLETELY REWRITTEN: Comprehensive error handling utility
    handleError(error, context = 'операция') {
      console.error(`❌ Ошибка в ${context}:`, error);
      
      let errorMessage = `Произошла ошибка при ${context}. Пожалуйста, попробуйте еще раз.`;

      // Check for specific error types and customize messages
      if (error.response) {
        // Server-side errors (HTTP status codes)
        switch (error.response.status) {
          case 400: errorMessage = `Неверный запрос: ${error.response.data?.message || 'проверьте данные.'}`; break;
          case 401: errorMessage = 'Необходимо войти в систему. Пожалуйста, обновите страницу или войдите снова.'; break;
          case 403: errorMessage = 'Доступ запрещен. У вас нет прав для этой операции.'; break;
          case 404: errorMessage = 'Ресурс не найден. Возможно, он был удален или перемещен.'; break;
          case 429: errorMessage = 'Слишком много запросов. Пожалуйста, подождите немного и повторите попытку.'; break;
          case 500: case 502: case 503: case 504:
            errorMessage = 'Ошибка сервера. Мы уже работаем над устранением проблемы. Пожалуйста, попробуйте позже.'; break;
          default:
            errorMessage = `Ошибка сервера (${error.response.status}): ${error.response.data?.message || 'неизвестная ошибка.'}`; break;
        }
      } else if (error.request) {
        // Network errors (no response received)
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (error.message) {
        // Other JavaScript errors or custom errors
        if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время ожидания запроса. Пожалуйста, попробуйте позже.';
        } else if (error.message.includes('ID темы не указан')) {
          errorMessage = 'ID темы не предоставлен. Проверьте адрес страницы.';
        } else if (error.message.includes('Invalid topic data received')) {
          errorMessage = 'Получены неверные данные темы от сервера. Обратитесь в поддержку.';
        } else {
          errorMessage = error.message; // Use the direct message for other errors
        }
      }
      
      // Log full error object in development for detailed debugging
      if (this.isDevelopment) {
        console.error('Full error object for debugging:', error);
      }

      return errorMessage;
    },
    
    // ✅ ENHANCED: Better retry logic with exponential backoff
    async retryLoad() {
      this.retryCount++;
      
      if (this.retryCount > 3) { // Limit retries to 3 attempts
        this.error = 'Превышено максимальное количество попыток. Пожалуйста, перезагрузите страницу.';
        this.loading = false;
        return;
      }
      
      // Exponential backoff: wait longer between retries (1s, 2s, 4s)
      const delay = Math.pow(2, this.retryCount - 1) * 1000; 
      
      console.log(`⏱️ Retrying load in ${delay}ms (attempt ${this.retryCount}/${3})`);
      
      // Use `setTimeout` and `await` to ensure the retry happens after the delay.
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Re-attempt initialization
      await this.initializeComponent();
    },
    
    // ✅ FIXED: Better topic name getter (uses `extractName` utility)
    getTopicName(topic) {
      if (!topic) return 'Без названия';
      return this.extractName(topic);
    },
    
    // ✅ FIXED: Better topic description getter (uses `extractDescription` utility)
    getTopicDescription(topic) {
      if (!topic) return 'Нет описания для этой темы.';
      return this.extractDescription(topic);
    },
    
    // ✅ FIXED: Better lesson name getter (uses `extractLessonName` utility)
    getLessonName(lesson) {
      if (!lesson) return 'Без названия';
      return this.extractLessonName(lesson);
    },
    
    // ✅ FIXED: Better lesson description getter (uses `extractLessonDescription` utility)
    getLessonDescription(lesson) {
      if (!lesson) return '';
      return this.extractLessonDescription(lesson);
    },
    
    // ✅ ENHANCED: Start lesson with better error handling and access check
    startLesson(lesson) {
      try {
        if (!lesson || !lesson._id && !lesson.id) {
          console.error('❌ Cannot start lesson: invalid lesson object or missing ID', lesson);
          this.error = 'Ошибка: недействительный урок или отсутствует ID.';
          return;
        }
        
        // Use `hasTopicAccess` or check directly for lesson type
        if ((lesson.type === 'premium' || lesson.type === 'pro') && !this.isPremiumUser) {
          console.log('🔒 Premium lesson requires subscription');
          // If the topic itself has restricted access, redirect to subscription.
          // Otherwise, if only this lesson is premium, notify user.
          this.handleSubscription(); // Or show a modal for this specific lesson
          return;
        }
        
        const lessonId = lesson._id || lesson.id;
        
        console.log('🚀 Starting lesson:', lessonId);
        this.$router.push({ name: 'LessonPage', params: { id: lessonId } });
        
      } catch (error) {
        console.error('❌ Error starting lesson:', error);
        this.error = 'Ошибка при запуске урока';
      }
    },
    
    // ✅ ENHANCED: Start first available lesson with better logic
    startFirstLesson() {
      try {
        // Filter lessons based on actual access via `isPremiumUser`
        const firstAvailable = this.lessons.find(
          lesson => lesson && (lesson.type !== 'premium' && lesson.type !== 'pro' || this.isPremiumUser)
        );
        
        if (firstAvailable) {
          console.log('🚀 Starting first available lesson:', this.getLessonName(firstAvailable));
          this.startLesson(firstAvailable);
        } else {
          console.log('🔒 No available lessons (all restricted or empty), redirecting to subscription');
          this.handleSubscription();
        }
      } catch (error) {
        console.error('❌ Error starting first lesson:', error);
        this.error = 'Ошибка при запуске первого урока';
      }
    },
    
    // ✅ ENHANCED: Handle subscription redirect
    handleSubscription() {
      try {
        console.log('💳 Redirecting to subscription page');
        
        this.$router.push({
          name: 'PaymePayment', // Assuming this is your payment route
          // Pass current topic ID if user was trying to access a specific restricted topic
          params: { plan: 'start' }, // Defaulting to 'start' plan
          query: { 
            returnTo: this.$route.fullPath, // Return to this page after payment
            from: 'topic',
            topicId: this.topic?._id || this.topic?.id // Pass the current topic ID
          }
        }).catch(err => {
          console.error('Router push to payment failed:', err);
          // Fallback to direct window location if router fails
          window.location.href = '/payment/start';
        });
      } catch (error) {
        console.error('❌ Error redirecting to subscription:', error);
        // Final fallback
        window.location.href = '/payment/start';
      }
    },
    
    // ✅ ENHANCED: Safe payment check method (dispatches to Vuex store)
    async checkPaymentStatus() {
      // Update last check timestamp
      this.lastPaymentCheck = Date.now(); 

      try {
        // Only check if user is authenticated and Vuex store is available
        if (!auth.currentUser || !this.$store) {
          console.log('ℹ️ Skipping payment status check: no authenticated user or store.');
          return;
        }
        
        console.log('💳 Checking for pending payments or subscription updates...');
        // Dispatch an action in your user module to check payment status/subscription.
        // This assumes you have an action like `user/checkPendingPayments` that
        // updates the user's status in the store.
        if (typeof this.$store.dispatch === 'function') {
          // Wrap in try-catch as dispatch might reject.
          await this.$store.dispatch('user/checkPendingPayments');
          console.log('✅ Payment status check dispatched successfully.');
        } else {
          console.warn('⚠️ Vuex store dispatch method not available for payment check.');
        }
        
      } catch (error) {
        console.warn('⚠️ Payment status check failed:', error.message);
        // Log the error but don't disrupt the component flow.
      }
    },

    // ✅ NEW: Check if user has access to a given topic (based on topic type and user plan)
    hasTopicAccess(topic) {
      if (!topic) return false;
      
      const topicType = topic.type || 'free';
      const userPlan = this.enhancedUserPlan;
      
      if (topicType === 'free') return true;
      
      if (topicType === 'premium') {
        return ['premium', 'start', 'pro'].includes(userPlan);
      }
      
      if (topicType === 'pro') {
        return userPlan === 'pro';
      }
      
      return false; // Default for unknown types or plans
    },

    // ✅ NEW: Cleanup method for all event listeners and intervals
    cleanup() {
      console.log('🧹 TopicOverview: Performing cleanup...');
      
      // Clear all active timeouts and intervals
      if (this.statusChangeTimeout) {
        clearTimeout(this.statusChangeTimeout);
        this.statusChangeTimeout = null;
      }
      
      if (this.paymentCheckInterval) {
        clearInterval(this.paymentCheckInterval);
        this.paymentCheckInterval = null;
      }
      
      if (this.statusSyncInterval) {
        clearInterval(this.statusSyncInterval);
        this.statusSyncInterval = null;
      }
      
      // Remove all DOM event listeners that were manually added
      if (typeof window !== 'undefined') {
        if (this.globalEventHandlers.subscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        }
        if (this.globalEventHandlers.storageChange) {
          window.removeEventListener('storage', this.globalEventHandlers.storageChange);
        }
      }
      
      // Remove all Event Bus listeners using their stored cleanup functions
      this.eventCleanupFunctions.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.warn('⚠️ TopicOverview: Error during Event Bus cleanup:', error);
        }
      });
      this.eventCleanupFunctions = []; // Clear the array after cleanup
      
      // Unsubscribe from the Vuex store
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
      
      // Clear the global event handlers object
      this.globalEventHandlers = {};
      
      console.log('✅ TopicOverview: Cleanup completed.');
    }
  },
  
  // ✅ ENHANCED: Lifecycle hook to manage intervals (moved from `created` to `mounted` then here)
  async created() {
    // This hook is called very early, before the DOM is mounted.
    // It's a good place for initial data setup that doesn't need DOM access.
    // Periodic checks might be better in mounted or after data is confirmed.
    // However, for consistency with the provided snippet, I'll keep the interval setup here
    // but recommend considering `mounted` for more complex async setups.
    try {
      // Initial payment check (this will also update userPlan in store/local)
      await this.checkPaymentStatus();
      
      // NOTE: `paymentCheckInterval` and `statusSyncInterval` are now managed by `setupPeriodicChecks`
      // which is called in `mounted`. This `created` hook can be simplified or removed
      // if its only purpose was paymentCheckInterval.
      // Keeping the `checkPaymentStatus` call here as it's a good early check.
    } catch (error) {
      console.warn('⚠️ Error in created hook during initial payment check:', error.message);
    }
  },
  
  // ✅ ENHANCED: Lifecycle hook for comprehensive cleanup
  beforeUnmount() {
    console.log('📱 TopicOverview: Component unmounting');
    // Call the centralized cleanup method
    this.cleanup();
  },
  
  // ✅ NEW: Error boundary for template errors (catches errors in component's rendering or method calls)
  errorCaptured(err, vm, info) {
    console.error('❌ TopicOverview: Component error captured:', err);
    console.error('Error info:', info);
    
    // Store error for debugging in development mode
    if (this.isDevelopment) {
      this.debugInfo = {
        ...this.debugInfo,
        templateError: err.message,
        errorInfo: info, // Vue-specific error info
        timestamp: new Date().toISOString()
      };
    }
    
    // Return false to prevent the error from propagating further up the component chain.
    // This allows the component to display a fallback UI (like the error container).
    return false;
  }
};
</script>
<style scoped>
.topic-overview {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-left-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Navigation */
.nav-header {
  padding: 1.5rem 2rem 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* Topic Content */
.topic-content {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

/* Topic Header */
.topic-header {
  padding: 2rem;
  color: white;
}

.topic-hero {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.topic-icon {
  font-size: 4rem;
  flex-shrink: 0;
}

.topic-info {
  flex: 1;
}

.topic-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.topic-description {
  font-size: 1.2rem;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0;
}

/* Topic Stats */
.topic-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  max-width: 600px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 500;
}

/* Lessons Section */
.lessons-section {
  background: white;
  border-radius: 24px 24px 0 0;
  min-height: 60vh;
  padding: 2rem;
  margin: 0 1rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.section-icon {
  font-size: 1.5rem;
}

/* Lesson Filters */
.lesson-filters {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 4px;
  border-radius: 12px;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-btn:hover:not(.active) {
  color: #3b82f6;
}

/* No Lessons State */
.no-lessons {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.no-lessons-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-lessons-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.no-lessons-text {
  font-size: 1rem;
  margin: 0;
}

/* Lessons Grid */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Lesson Card */
.lesson-card {
  position: relative;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.lesson-card:hover {
  border-color: #3b82f6;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.lesson-card.locked {
  opacity: 0.7;
  cursor: default;
}

.lesson-card.locked:hover {
  transform: none;
  border-color: #e5e7eb;
}

.lesson-card.premium {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
}

.lesson-number {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.lesson-card.premium .lesson-number {
  background: #f59e0b;
}

/* Lesson Badge */
.lesson-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.lesson-badge.free {
  background: #d1fae5;
  color: #065f46;
}

.lesson-badge.premium {
  background: #fef3c7;
  color: #92400e;
}

/* Lesson Content */
.lesson-content {
  margin-bottom: 1.5rem;
}

.lesson-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
  padding-right: 3rem;
}

.lesson-description {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

/* Lesson Meta */
.lesson-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.meta-item svg {
  opacity: 0.7;
}

/* Action Button */
.lesson-action {
  margin-top: auto;
}

.action-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #3b82f6;
  color: white;
  font-size: 0.95rem;
}

.action-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.action-btn.premium {
  background: #f59e0b;
  color: white;
}

.action-btn.premium:hover {
  background: #d97706;
}

.action-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* Lock Overlay */
.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.lock-icon {
  color: #6b7280;
  opacity: 0.7;
}

/* Action Section */
.action-section {
  background: white;
  margin: 0 1rem;
  padding: 3rem 2rem;
  border-radius: 0 0 24px 24px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.action-content {
  max-width: 600px;
  margin: 0 auto;
}

.action-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.action-description {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-premium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
}

.btn-secondary {
  background: transparent;
  color: #6b7280;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #9ca3af;
  color: #374151;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  backdrop-filter: blur(10px);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-start {
  min-width: 200px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .topic-title {
    font-size: 2rem;
  }
  
  .topic-hero {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .topic-icon {
    font-size: 3rem;
  }
  
  .topic-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-title {
    text-align: center;
  }
  
  .lesson-filters {
    justify-content: center;
  }
  
  .lessons-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 280px;
  }
  
  .lessons-section {
    margin: 0 0.5rem;
    padding: 1.5rem;
  }
  
  .action-section {
    margin: 0 0.5rem;
    padding: 2rem 1.5rem;
  }
  
  .nav-header {
    padding: 1rem;
  }
  
  .topic-header {
    padding: 1.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .topic-title {
    font-size: 1.75rem;
  }
  
  .topic-description {
    font-size: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .lesson-card {
    padding: 1.25rem;
  }
  
  .lesson-title {
    font-size: 1.1rem;
    padding-right: 2.5rem;
  }
  
  .lesson-number {
    width: 2rem;
    height: 2rem;
    font-size: 0.8rem;
  }
  
  .filter-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
}

/* Animation Classes */
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Focus States for Accessibility */
.back-button:focus,
.action-btn:focus,
.btn:focus,
.filter-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print Styles */
@media print {
  .topic-overview {
    background: white !important;
  }
  
  .back-button,
  .action-section {
    display: none;
  }
  
  .lesson-card {
    break-inside: avoid;
    border: 1px solid #e5e7eb !important;
    background: white !important;
  }
}

/* Dark Mode Support (if needed later) */
@media (prefers-color-scheme: dark) {
  /* Dark mode styles can be added here */
}
</style>