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
            <div class="stat-number">{{ Math.round(overallProgress) }}%</div>
            <div class="stat-label">Прогресс</div>
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
            <button 
              :class="['filter-btn', { active: filter === 'completed' }]"
              @click="filter = 'completed'"
            >
              Завершённые ({{ completedCount }})
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
              premium: lesson.type === 'premium',
              completed: lesson.progress?.completed,
              'in-progress': lesson.progress?.progressPercent > 0 && !lesson.progress?.completed
            }"
            @click="startLesson(lesson)"
          >
            <div class="lesson-number">{{ index + 1 }}</div>

            <!-- Progress indicator -->
            <div v-if="lesson.progress?.progressPercent > 0" class="lesson-progress-indicator">
              <div class="progress-circle" :class="{ completed: lesson.progress?.completed }">
                <svg class="progress-ring" width="40" height="40">
                  <circle
                    class="progress-ring-circle-bg"
                    stroke="#e5e7eb"
                    stroke-width="3"
                    fill="transparent"
                    r="16"
                    cx="20"
                    cy="20"
                  />
                  <circle
                    class="progress-ring-circle"
                    :stroke="lesson.progress?.completed ? '#10b981' : '#3b82f6'"
                    stroke-width="3"
                    fill="transparent"
                    r="16"
                    cx="20"
                    cy="20"
                    :stroke-dasharray="`${2 * Math.PI * 16}`"
                    :stroke-dashoffset="`${2 * Math.PI * 16 * (1 - (lesson.progress?.progressPercent || 0) / 100)}`"
                  />
                </svg>
                <div class="progress-text">
                  {{ lesson.progress?.completed ? '✓' : Math.round(lesson.progress?.progressPercent || 0) + '%' }}
                </div>
              </div>
            </div>

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

              <!-- Progress bar -->
              <div v-if="lesson.progress || currentUser" class="lesson-progress">
                <div class="progress-info">
                  <span class="progress-label">
                    {{ lesson.progress?.completed ? 'Завершено' : 
                       lesson.progress?.progressPercent > 0 ? 'В процессе' : 'Не начато' }}
                  </span>
                  <span class="progress-percentage">
                    {{ Math.round(lesson.progress?.progressPercent || 0) }}%
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :class="{
                      completed: lesson.progress?.completed,
                      'in-progress': lesson.progress?.progressPercent > 0 && !lesson.progress?.completed
                    }"
                    :style="{ width: (lesson.progress?.progressPercent || 0) + '%' }"
                  ></div>
                </div>
                <div v-if="lesson.progress?.stars > 0" class="lesson-stars">
                  <span v-for="star in 3" :key="star" class="star" :class="{ filled: star <= (lesson.progress?.stars || 0) }">
                    ⭐
                  </span>
                </div>
              </div>

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
                <span v-if="lesson.progress?.duration" class="meta-item time-spent">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ formatDuration(lesson.progress.duration) }} потрачено
                </span>
              </div>
            </div>

            <div class="lesson-action">
              <button 
                class="action-btn"
                :class="{ 
                  locked: lesson.type === 'premium' && !isPremiumUser,
                  premium: lesson.type === 'premium' && !isPremiumUser,
                  completed: lesson.progress?.completed,
                  'continue': lesson.progress?.progressPercent > 0 && !lesson.progress?.completed
                }"
                :disabled="lesson.type === 'premium' && !isPremiumUser"
                @click.stop="startLesson(lesson)"
              >
                <span v-if="lesson.type === 'premium' && !isPremiumUser">
                  🔒 Требуется подписка
                </span>
                <span v-else-if="lesson.progress?.completed">
                  ✅ Пройти ещё раз
                </span>
                <span v-else-if="lesson.progress?.progressPercent > 0">
                  ▶️ Продолжить урок
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
import { getTopicById, getLessonsByTopic, getUserStatus, getUserProgress, getLessonProgress } from '@/api';
import { auth } from '@/firebase';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: null,
      lessons: [],
      userProgress: [], // Store user progress for all lessons
      loading: true,
      lessonsLoading: false,
      progressLoading: false,
      userPlan: 'free',
      filter: 'all',
      error: null,
      retryCount: 0,
      showDebugInfo: false,
      debugInfo: null,
      lastApiResponse: null,

      // Enhanced reactivity tracking
      componentKey: 0,
      lastUpdateTime: Date.now(),
      eventCleanupFunctions: [],
      globalEventHandlers: {},
      statusChangeTimeout: null,
      
      // Status tracking
      lastStatusSync: Date.now(),
      statusSyncInterval: null,
      userStatusOverride: null,
      
      // Payment tracking
      paymentCheckInterval: null,
      lastPaymentCheck: Date.now(),
      storeUnsubscribe: null,
    };
  },
  
  computed: {
    filteredLessons() {
      if (this.filter === 'all') return this.lessons;
      if (this.filter === 'completed') {
        return this.lessons.filter(lesson => lesson.progress?.completed);
      }
      return this.lessons.filter(lesson => lesson.type === this.filter);
    },
    
    freeCount() {
      return this.lessons.filter(lesson => lesson.type !== 'premium').length;
    },
    
    premiumCount() {
      return this.lessons.filter(lesson => lesson.type === 'premium').length;
    },
    
    completedCount() {
      return this.lessons.filter(lesson => lesson.progress?.completed).length;
    },
    
    // Calculate overall progress across all lessons
    overallProgress() {
      if (!this.lessons.length) return 0;
      
      const totalProgress = this.lessons.reduce((sum, lesson) => {
        return sum + (lesson.progress?.progressPercent || 0);
      }, 0);
      
      return totalProgress / this.lessons.length;
    },
    
    currentUser() {
      return auth.currentUser;
    },
    
    isDevelopment() {
      return import.meta.env.MODE === 'development';
    },

    // Enhanced user plan with store integration
    enhancedUserPlan() {
      const storePlan = this.$store?.getters?.['user/userStatus'];
      const localPlan = localStorage.getItem('userStatus');
      const componentPlan = this.userPlan;
      const overridePlan = this.userStatusOverride;
      
      const forceReactivityFromCounter = this.$store?.getters?.['user/forceUpdateCounter'];
      const forceReactivityFromUpdateTime = this.lastUpdateTime; 
      const forceReactivityFromSyncTime = this.lastStatusSync;

      const finalPlan = overridePlan || storePlan || localPlan || componentPlan || 'free';
      
   
      
      return finalPlan;
    },
    
    isPremiumUser() {
      const plan = this.enhancedUserPlan;
      const premiumPlans = ['premium', 'start', 'pro'];
      const isPremium = premiumPlans.includes(plan);
      
      
      return isPremium;
    },
    
    reactiveAvailableCount() {
      return this.lessons.filter(lesson => 
        lesson && (lesson.type !== 'premium' || this.isPremiumUser)
      ).length;
    },
    
    userStatusLabel() {
      const plan = this.enhancedUserPlan;
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'premium': 'Start',
        'free': 'Free'
      };
      return labels[plan] || 'Free';
    }
  },
  
  watch: {
    enhancedUserPlan: {
      handler(newPlan, oldPlan) {
        if (newPlan !== oldPlan) {
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    },
    
    '$store.getters["user/userStatus"]': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.userPlan = newStatus || 'free';
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    },

    // Watch for when user authentication changes to load progress
    currentUser: {
      handler(newUser, oldUser) {
        if (newUser && newUser !== oldUser) {
          this.loadUserProgressForLessons();
        } else if (!newUser && oldUser) {
          this.clearUserProgress();
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    
    try {
      await this.initializeComponent();
      this.setupEventListeners();
      this.setupPeriodicChecks();
      
      
    } catch (error) {
      console.error('❌ TopicOverview: Mount error:', error);
      this.loading = false; 
    }
  },
  
  methods: {
    // Navigate to profile catalogue method
    navigateToProfile() {
      try {
        this.$router.push({ name: 'CataloguePage' });
      } catch (error) {
        console.error('❌ Error navigating to profile:', error);
        this.$router.push('/profile/catalogue');
      }
    },

    // Robust initialization with comprehensive error handling
    async initializeComponent() {
      try {
        this.loading = true;
        this.error = null;
        this.retryCount = 0;
        this.topic = null;
        this.lessons = [];

        
        await this.waitForAuth();
        await this.loadUserPlan();
        await this.loadTopicData();
        
        // Load user progress after topic and lessons are loaded
        if (this.currentUser && this.lessons.length > 0) {
          await this.loadUserProgressForLessons();
        }
        
        
      } catch (error) {
        console.error('❌ Component initialization failed:', error);
        this.error = this.handleError(error, 'инициализация компонента');
        this.loading = false;
        this.topic = null;
        this.lessons = [];
        
        if (this.isDevelopment) {
          this.debugInfo = {
            error: error.message,
            stack: error.stack,
            routeParams: this.$route.params,
            timestamp: new Date().toISOString(),
          };
        }
      } finally {
        this.loading = false;
      }
    },

    // Load user progress for all lessons in the topic
    async loadUserProgressForLessons() {
      if (!this.currentUser || !this.lessons.length) {
        return;
      }

      try {
        this.progressLoading = true;
        const userId = this.currentUser.uid;
        

        // Method 1: Try to get all user progress at once
        try {
          const userProgressResult = await getUserProgress(userId);
          
          if (userProgressResult.success && Array.isArray(userProgressResult.data)) {
            this.mapProgressToLessons(userProgressResult.data);
            return;
          }
        } catch (bulkError) {
        }

        // Method 2: Load progress for each lesson individually
        const progressPromises = this.lessons.map(async (lesson) => {
          try {
            const progressResult = await getLessonProgress(userId, lesson._id || lesson.id);
            return {
              lessonId: lesson._id || lesson.id,
              progress: progressResult.success ? progressResult.data : null
            };
          } catch (error) {
            return {
              lessonId: lesson._id || lesson.id,
              progress: null
            };
          }
        });

        const progressResults = await Promise.all(progressPromises);
        
        // Map individual progress results to lessons
        progressResults.forEach(({ lessonId, progress }) => {
          const lesson = this.lessons.find(l => (l._id || l.id) === lessonId);
          if (lesson && progress) {
            lesson.progress = this.normalizeProgressData(progress);
          }
        });


      } catch (error) {
        console.error('❌ Error loading user progress:', error);
      } finally {
        this.progressLoading = false;
      }
    },

    // Map progress data from bulk endpoint to lessons
    mapProgressToLessons(progressArray) {
      if (!Array.isArray(progressArray)) {
        return;
      }

      this.lessons.forEach(lesson => {
        const lessonId = lesson._id || lesson.id;
        const progressRecord = progressArray.find(p => 
          p.lessonId === lessonId || 
          (p.lesson && (p.lesson._id === lessonId || p.lesson.id === lessonId))
        );

        if (progressRecord) {
          lesson.progress = this.normalizeProgressData(progressRecord);
        }
      });

    },

    // Normalize progress data structure
    normalizeProgressData(rawProgress) {
      if (!rawProgress) return null;

      return {
        progressPercent: rawProgress.progressPercent || rawProgress.progress || 0,
        completed: rawProgress.completed || false,
        stars: rawProgress.stars || 0,
        duration: rawProgress.duration || rawProgress.durationSeconds || 0,
        mistakes: rawProgress.mistakes || 0,
        points: rawProgress.points || 0,
        lastAccessed: rawProgress.lastAccessed || rawProgress.updatedAt,
        completedSteps: rawProgress.completedSteps || [],
        _raw: this.isDevelopment ? rawProgress : undefined
      };
    },

    // Clear user progress when user logs out
    clearUserProgress() {
      this.lessons.forEach(lesson => {
        if (lesson.progress) {
          delete lesson.progress;
        }
      });
    },

    // Format duration in minutes and seconds
    formatDuration(seconds) {
      if (!seconds || seconds < 60) {
        return `${seconds || 0}с`;
      }
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (remainingSeconds === 0) {
        return `${minutes}м`;
      }
      
      return `${minutes}м ${remainingSeconds}с`;
    },

    // Trigger reactivity update
    triggerReactivityUpdate() {
      this.lastUpdateTime = Date.now();
      this.componentKey++;
    },

    // Setup event listeners for external changes
    setupEventListeners() {
      
      // Listen for subscription changes
      if (typeof window !== 'undefined') {
        this.globalEventHandlers.subscriptionChange = (event) => {
          this.userPlan = event.detail.newPlan || 'free';
          this.triggerReactivityUpdate();
        };
        
        window.addEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        
        // Listen for localStorage changes from other tabs
        this.globalEventHandlers.storageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== this.userPlan) {
            this.userPlan = event.newValue || 'free';
            this.triggerReactivityUpdate();
          }
        };
        
        window.addEventListener('storage', this.globalEventHandlers.storageChange);
      }
    },

    // Setup periodic checks
    setupPeriodicChecks() {
      
      // Check payment status every 30 seconds
      this.paymentCheckInterval = setInterval(() => {
        this.checkPaymentStatus();
      }, 30000);
      
      // Sync user status every 2 minutes
      this.statusSyncInterval = setInterval(() => {
        this.loadUserPlan();
      }, 120000);
    },

    // Enhanced authentication waiting with timeout
    async waitForAuth() {
      if (auth.currentUser) {
        return;
      }
      
      
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
          } else {
          }
          resolve();
        });
        
        setTimeout(() => {
          unsubscribe(); 
          resolve();
        }, 3000);
      });
    },
    
    // Load topic data with comprehensive error handling
    async loadTopicData() {
      const topicId = this.$route.params.id;

      if (!topicId) {
        this.error = 'ID темы не указан в URL';
        this.loading = false;
        return;
      }

      try {
        this.loading = true;
        this.error = null;
        
        
        const topicResult = await getTopicById(topicId);
        
        this.lastApiResponse = topicResult;
        
        let topicData = null;
        let responseFormat = 'unknown';
        
        if (topicResult) {
          if (topicResult.success === true && topicResult.data) {
            topicData = topicResult.data;
            responseFormat = 'success_wrapper';
          }
          else if (topicResult.exists === true && topicResult.data) {
            topicData = topicResult.data;
            responseFormat = 'exists_wrapper';
          }
          else if (topicResult._id || topicResult.id || topicResult.name || topicResult.topicName) {
            topicData = topicResult;
            responseFormat = 'direct_object';
          }
          else if (topicResult.data && (topicResult.data._id || topicResult.data.id || topicResult.data.name || topicResult.data.topicName)) {
            topicData = topicResult.data;
            responseFormat = 'nested_data';
          }
          else if (topicResult.success === false || topicResult.error) {
            const errorMsg = topicResult.message || topicResult.error || 'API returned an error for topic data.';
            throw new Error(`API Error: ${errorMsg}`);
          }
        }
        
        if (!topicData || !topicData._id && !topicData.id) {
          console.error('❌ No valid topic data found in response after parsing:', topicResult);
          
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
        
        this.topic = this.normalizeTopicData(topicData);
        

        await this.loadLessonsForTopic(this.topic._id || this.topic.id);
        
      } catch (err) {
        console.error('❌ Error loading topic data:', err);
        
        this.error = this.handleError(err, 'загрузка темы');
        this.topic = null;
        this.lessons = [];
        
        if (this.isDevelopment) {
          this.debugInfo = {
            error: err.message,
            response: this.lastApiResponse,
            topicId: topicId,
            stack: err.stack,
            timestamp: new Date().toISOString()
          };
        }
        
      } finally {
        this.loading = false;
      }
    },
    
    // Load lessons for topic with comprehensive error handling
    async loadLessonsForTopic(topicId) {
      if (!topicId) {
        this.lessons = [];
        return;
      }

      try {
        this.lessonsLoading = true;
        
        const lessonsResult = await getLessonsByTopic(topicId);
        
        let lessonsData = [];
        let lessonsFormat = 'unknown';
        
        if (lessonsResult) {
          if (lessonsResult.success === true && Array.isArray(lessonsResult.data)) {
            lessonsData = lessonsResult.data;
            lessonsFormat = 'success_data_array';
          } else if (lessonsResult.success === true && Array.isArray(lessonsResult.lessons)) {
            lessonsData = lessonsResult.lessons;
            lessonsFormat = 'success_lessons_array';
          } else if (Array.isArray(lessonsResult.data)) {
            lessonsData = lessonsResult.data;
            lessonsFormat = 'nested_data_array';
          } else if (Array.isArray(lessonsResult.lessons)) {
            lessonsData = lessonsResult.lessons;
            lessonsFormat = 'nested_lessons_array';
          } else if (Array.isArray(lessonsResult)) {
            lessonsData = lessonsResult;
            lessonsFormat = 'direct_array';
          } else if (lessonsResult.success === false) {
            lessonsData = [];
            lessonsFormat = 'error_response';
          }
        }
        
        
        this.lessons = lessonsData
          .map((lesson, index) => this.normalizeLessonData(lesson, topicId, index))
          .filter(lesson => lesson !== null);
        
        
      } catch (lessonError) {
        console.error('❌ Error loading lessons:', lessonError);
        this.lessons = [];
        
        
        if (this.isDevelopment) {
          this.debugInfo = {
            ...this.debugInfo,
            lessonLoadError: lessonError.message,
            lessonLoadStack: lessonError.stack,
            lessonsApiResponse: this.lastApiResponse
          };
        }
      } finally {
        this.lessonsLoading = false;
      }
    },
    
    // Topic data normalization function
    normalizeTopicData(rawData) {
      if (!rawData) {
        return null;
      }
      
      const normalized = {
        _id: rawData._id || rawData.id,
        id: rawData.id || rawData._id,
        
        name: this.extractName(rawData),
        topicName: this.extractName(rawData),
        
        description: this.extractDescription(rawData),
        topicDescription: this.extractDescription(rawData),
        
        subject: rawData.subject || 'General',
        level: rawData.level || 1,
        type: rawData.type || 'free',
        
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
        
        metadata: rawData.metadata || {},
        isActive: rawData.isActive !== undefined ? rawData.isActive : true,
        isDraft: rawData.isDraft || false,
        
        _raw: this.isDevelopment ? rawData : undefined
      };

      if (!normalized._id && !normalized.id) {
          console.error('Normalization: Topic data missing a valid ID:', rawData);
          return null;
      }
      if (!normalized.name || normalized.name === 'Без названия') {
          normalized.name = `Тема ${normalized._id?.substring(0, 8) || ''}`;
      }

      return normalized;
    },
    
    // Lesson data normalization function
    normalizeLessonData(rawLesson, topicId, index) {
      if (!rawLesson) {
        return null;
      }

      const normalized = {
        _id: rawLesson._id || rawLesson.id || `lesson_fallback_${topicId}_${index}`,
        id: rawLesson.id || rawLesson._id || `lesson_fallback_${topicId}_${index}`,
        
        lessonName: this.extractLessonName(rawLesson),
        title: this.extractLessonName(rawLesson),
        name: this.extractLessonName(rawLesson),
        
        description: this.extractLessonDescription(rawLesson),
        desc: this.extractLessonDescription(rawLesson),
        
        type: rawLesson.type || 'free',
        
        topicId: rawLesson.topicId || topicId,
        topic: rawLesson.topic || this.topic?.name || 'Unknown Topic',
        
        steps: Array.isArray(rawLesson.steps) ? rawLesson.steps : [],
        metadata: rawLesson.metadata || { estimatedDuration: 30 },
        homework: rawLesson.homework || { totalExercises: 0 },
        
        isActive: rawLesson.isActive !== undefined ? rawLesson.isActive : true,
        isDraft: rawLesson.isDraft || false,
        
        // Initialize progress as null - will be loaded separately
        progress: null,
        
        _raw: this.isDevelopment ? rawLesson : undefined
      };

      if (!normalized.lessonName || normalized.lessonName === 'Без названия') {
          normalized.lessonName = `Урок ${index + 1} (${normalized._id.substring(0, 8)})`;
      }

      return normalized;
    },
    
    // Enhanced user plan loading from multiple reliable sources
    async loadUserPlan() {
      try {
        
        const storeStatus = this.$store?.getters?.['user/userStatus'];
        if (storeStatus && ['premium', 'start', 'pro', 'free'].includes(storeStatus)) {
          this.userPlan = storeStatus;
          return;
        }
        
        const localStatus = localStorage.getItem('userStatus');
        if (localStatus && ['premium', 'start', 'pro', 'free'].includes(localStatus)) {
          this.userPlan = localStatus;
          if (!storeStatus) {
            this.$store.commit('user/SET_USER_STATUS', localStatus); 
          }
          return;
        }
        
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;

          try {
            const statusResult = await getUserStatus(userId);
            
            if (statusResult && statusResult.success) {
              const apiPlan = statusResult.status || statusResult.data?.subscriptionPlan || 'free';
              this.userPlan = apiPlan;
              localStorage.setItem('userStatus', apiPlan);
              this.$store.commit('user/SET_USER_STATUS', apiPlan);
              return;
            } else {
            }
          } catch (apiError) {
          }
        }
        
        this.userPlan = 'free';
        localStorage.setItem('userStatus', 'free');
        this.$store.commit('user/SET_USER_STATUS', 'free');
        
      } catch (err) {
        this.userPlan = 'free';
      }
    },

    // Enhanced name extraction with fallbacks
    extractName(data) {
      if (!data) return 'Без названия';
      
      if (typeof data.name === 'string' && data.name.trim()) {
        return data.name.trim();
      }
      
      if (typeof data.name === 'object' && data.name !== null) {
        const localized = data.name[this.lang] || data.name.en || data.name.ru || data.name.uz;
        if (localized && typeof localized === 'string' && localized.trim()) {
          return localized.trim();
        }
        
        const values = Object.values(data.name);
        for (const value of values) {
          if (value && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
      
      const nameFields = ['topicName', 'title', 'displayName', 'topic'];
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
      
      return 'Без названия';
    },
    
    // Enhanced description extraction with fallbacks
    extractDescription(data) {
      if (!data) return 'Нет описания';
      
      if (typeof data.description === 'string' && data.description.trim()) {
        return data.description.trim();
      }
      
      if (typeof data.description === 'object' && data.description !== null) {
        const localized = data.description[this.lang] || data.description.en || data.description.ru || data.description.uz;
        if (localized && typeof localized === 'string' && localized.trim()) {
          return localized.trim();
        }
        
        const values = Object.values(data.description);
        for (const value of values) {
          if (value && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
      
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
    
    // Enhanced lesson name extraction with more robust checks
    extractLessonName(lesson) {
      if (!lesson) return 'Без названия';
      
      const nameFields = ['lessonName', 'title', 'name'];
      
      for (const field of nameFields) {
        if (typeof lesson[field] === 'string' && lesson[field].trim()) {
          return lesson[field].trim();
        }
        if (typeof lesson[field] === 'object' && lesson[field] !== null) {
          const localized = lesson[field][this.lang] || lesson[field].en || lesson[field].ru || lesson[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }

      if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
      }
      if (typeof lesson.topic === 'object' && lesson.topic !== null) {
          const localizedTopic = lesson.topic[this.lang] || lesson.topic.en || lesson.topic.ru || lesson.topic.uz;
          if (localizedTopic && typeof localizedTopic === 'string' && localizedTopic.trim()) {
              return localizedTopic.trim();
          }
      }
      
      return 'Без названия';
    },
    
    // Enhanced lesson description extraction with more robust checks
    extractLessonDescription(lesson) {
      if (!lesson) return '';
      
      const descFields = ['description', 'desc', 'summary', 'info'];
      
      for (const field of descFields) {
        if (typeof lesson[field] === 'string' && lesson[field].trim()) {
          return lesson[field].trim();
        }
        if (typeof lesson[field] === 'object' && lesson[field] !== null) {
          const localized = lesson[field][this.lang] || lesson[field].en || lesson[field].ru || lesson[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }
      
      return '';
    },

    // Get user subscription from multiple sources
    getUserSubscription() {
      return this.enhancedUserPlan;
    },
    
    // Comprehensive error handling utility
    handleError(error, context = 'операция') {
      console.error(`❌ Ошибка в ${context}:`, error);
      
      let errorMessage = `Произошла ошибка при ${context}. Пожалуйста, попробуйте еще раз.`;

      if (error.response) {
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
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время ожидания запроса. Пожалуйста, попробуйте позже.';
        } else if (error.message.includes('ID темы не указан')) {
          errorMessage = 'ID темы не предоставлен. Проверьте адрес страницы.';
        } else if (error.message.includes('Invalid topic data received')) {
          errorMessage = 'Получены неверные данные темы от сервера. Обратитесь в поддержку.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (this.isDevelopment) {
        console.error('Full error object for debugging:', error);
      }

      return errorMessage;
    },
    
    // Better retry logic with exponential backoff
    async retryLoad() {
      this.retryCount++;
      
      if (this.retryCount > 3) {
        this.error = 'Превышено максимальное количество попыток. Пожалуйста, перезагрузите страницу.';
        this.loading = false;
        return;
      }
      
      const delay = Math.pow(2, this.retryCount - 1) * 1000; 
      
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await this.initializeComponent();
    },
    
    // Better topic name getter
    getTopicName(topic) {
      if (!topic) return 'Без названия';
      return this.extractName(topic);
    },
    
    // Better topic description getter
    getTopicDescription(topic) {
      if (!topic) return 'Нет описания для этой темы.';
      return this.extractDescription(topic);
    },
    
    // Better lesson name getter
    getLessonName(lesson) {
      if (!lesson) return 'Без названия';
      return this.extractLessonName(lesson);
    },
    
    // Better lesson description getter
    getLessonDescription(lesson) {
      if (!lesson) return '';
      return this.extractLessonDescription(lesson);
    },
    
    // Start lesson with better error handling and access check
    startLesson(lesson) {
      try {
        if (!lesson || !lesson._id && !lesson.id) {
          console.error('❌ Cannot start lesson: invalid lesson object or missing ID', lesson);
          this.error = 'Ошибка: недействительный урок или отсутствует ID.';
          return;
        }
        
        if ((lesson.type === 'premium' || lesson.type === 'pro') && !this.isPremiumUser) {
          this.handleSubscription();
          return;
        }
        
        const lessonId = lesson._id || lesson.id;
        
        this.$router.push({ name: 'LessonPage', params: { id: lessonId } });
        
      } catch (error) {
        console.error('❌ Error starting lesson:', error);
        this.error = 'Ошибка при запуске урока';
      }
    },
    
    // Start first available lesson with better logic
    startFirstLesson() {
      try {
        const firstAvailable = this.lessons.find(
          lesson => lesson && (lesson.type !== 'premium' && lesson.type !== 'pro' || this.isPremiumUser)
        );
        
        if (firstAvailable) {
          this.startLesson(firstAvailable);
        } else {
          this.handleSubscription();
        }
      } catch (error) {
        console.error('❌ Error starting first lesson:', error);
        this.error = 'Ошибка при запуске первого урока';
      }
    },
    
    // Handle subscription redirect
    handleSubscription() {
      try {
        
        this.$router.push({
          name: 'PaymePayment',
          params: { plan: 'start' },
          query: { 
            returnTo: this.$route.fullPath,
            from: 'topic',
            topicId: this.topic?._id || this.topic?.id
          }
        }).catch(err => {
          console.error('Router push to payment failed:', err);
          window.location.href = '/payment/start';
        });
      } catch (error) {
        console.error('❌ Error redirecting to subscription:', error);
        window.location.href = '/payment/start';
      }
    },
    
    // Safe payment check method
    async checkPaymentStatus() {
      this.lastPaymentCheck = Date.now(); 

      try {
        if (!auth.currentUser || !this.$store) {
          return;
        }
        
        if (typeof this.$store.dispatch === 'function') {
          await this.$store.dispatch('user/checkPendingPayments');
        } else {
        }
        
      } catch (error) {
      }
    },

    // Check if user has access to a given topic
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
      
      return false;
    },

    // Cleanup method for all event listeners and intervals
    cleanup() {
      
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
      
      if (typeof window !== 'undefined') {
        if (this.globalEventHandlers.subscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        }
        if (this.globalEventHandlers.storageChange) {
          window.removeEventListener('storage', this.globalEventHandlers.storageChange);
        }
      }
      
      this.eventCleanupFunctions.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
        }
      });
      this.eventCleanupFunctions = [];
      
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
      
      this.globalEventHandlers = {};
      
    }
  },
  
  // Lifecycle hook to manage intervals
  async created() {
    try {
      await this.checkPaymentStatus();
    } catch (error) {
    }
  },
  
  // Lifecycle hook for comprehensive cleanup
  beforeUnmount() {
    this.cleanup();
  },
  
  // Error boundary for template errors
  errorCaptured(err, vm, info) {
    console.error('❌ TopicOverview: Component error captured:', err);
    console.error('Error info:', info);
    
    if (this.isDevelopment) {
      this.debugInfo = {
        ...this.debugInfo,
        templateError: err.message,
        errorInfo: info,
        timestamp: new Date().toISOString()
      };
    }
    
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
  flex-wrap: wrap;
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
  white-space: nowrap;
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

.lesson-card.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.lesson-card.in-progress {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
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
  z-index: 2;
}

.lesson-card.premium .lesson-number {
  background: #f59e0b;
}

.lesson-card.completed .lesson-number {
  background: #10b981;
}

/* Progress Indicator */
.lesson-progress-indicator {
  position: absolute;
  top: 0.75rem;
  left: 1rem;
  z-index: 3;
}

.progress-circle {
  position: relative;
  width: 40px;
  height: 40px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dashoffset 0.5s ease-in-out;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: #3b82f6;
}

.progress-circle.completed .progress-text {
  color: #10b981;
  font-size: 1rem;
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

/* Progress Bar */
.lesson-progress {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.progress-percentage {
  font-size: 0.85rem;
  font-weight: 600;
  color: #3b82f6;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.5s ease-in-out;
  border-radius: 3px;
}

.progress-fill.completed {
  background: #10b981;
}

.progress-fill.in-progress {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

/* Lesson Stars */
.lesson-stars {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  justify-content: center;
}

.star {
  font-size: 0.8rem;
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.star.filled {
  opacity: 1;
}

/* Lesson Meta */
.lesson-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.meta-item.time-spent {
  color: #059669;
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

.action-btn.completed {
  background: #10b981;
  color: white;
}

.action-btn.completed:hover {
  background: #059669;
}

.action-btn.continue {
  background: #3b82f6;
  color: white;
}

.action-btn.continue:hover {
  background: #2563eb;
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

/* Debug Info */
.debug-info {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-align: left;
}

.debug-info h4 {
  color: #f59e0b;
  margin: 0 0 0.5rem 0;
}

.debug-info pre {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
  color: white;
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

  .lesson-meta {
    gap: 0.75rem;
  }

  .meta-item {
    font-size: 0.8rem;
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

  .progress-circle {
    width: 32px;
    height: 32px;
  }

  .progress-text {
    font-size: 0.6rem;
  }

  .lesson-progress {
    padding: 0.5rem;
  }

  .lesson-meta {
    flex-direction: column;
    gap: 0.5rem;
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

  .lesson-progress-indicator,
  .progress-circle {
    display: none;
  }
}
</style>