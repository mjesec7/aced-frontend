<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ $t('loadingStates.course') }}</p>
    </div>

    <div v-else-if="!topic || error" class="error-container">
      <div class="error-icon">❌</div>
      <h3 class="error-title">
        {{ topic ? 'An error occurred' : 'Topic not found' }}
      </h3>
      <p class="error-message">
        {{ topic ? error : 'The topic may have been deleted or you do not have access to it' }}
      </p>
      <button @click="navigateToProfile" class="btn btn-back">
        ⬅️ {{ $t('topicOverview.backToCatalog') }}
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
          {{ $t('topicOverview.backToCatalog') }}
        </button>
      </div>

      <div class="topic-header">
        <div class="topic-hero">
          <div class="topic-icon">📘</div>
          <div class="topic-info" :key="`topic-info-${language}`">
            <h1 class="topic-title">{{ getTopicName(topic) }}</h1>
            <p class="topic-description">{{ getTopicDescription(topic) }}</p>
          </div>
        </div>

        <div class="topic-stats">
          <div class="stat-card">
            <div class="stat-number">{{ lessons.length }}</div>
            <div class="stat-label">{{ $t('topicOverview.totalLessons') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ freeCount }}</div>
            <div class="stat-label">{{ $t('topicOverview.free') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ premiumCount }}</div>
            <div class="stat-label">{{ $t('topicOverview.premium') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ Math.round(overallProgress) }}%</div>
            <div class="stat-label">{{ $t('topicOverview.progress') }}</div>
          </div>
        </div>
      </div>

      <div class="lessons-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📚</span>
            {{ $t('topicOverview.courseLessons') }}
          </h2>
          <div class="lesson-filters">
            <button
              :class="['filter-btn', { active: filter === 'all' }]"
              @click="filter = 'all'"
            >
              {{ $t('topicOverview.all') }} ({{ lessons.length }})
            </button>
            <button
              :class="['filter-btn', { active: filter === 'free' }]"
              @click="filter = 'free'"
            >
              {{ $t('topicOverview.free') }} ({{ freeCount }})
            </button>
            <button
              :class="['filter-btn', { active: filter === 'premium' }]"
              @click="filter = 'premium'"
            >
              {{ $t('topicOverview.premium') }} ({{ premiumCount }})
            </button>
            <button
              :class="['filter-btn', { active: filter === 'completed' }]"
              @click="filter = 'completed'"
            >
              {{ $t('topicOverview.completed') }} ({{ completedCount }})
            </button>
          </div>
        </div>

        <div v-if="filteredLessons.length === 0" class="no-lessons">
          <div class="no-lessons-icon">📭</div>
          <h3 class="no-lessons-title">{{ $t('topicOverview.noLessonsFound') }}</h3>
          <p class="no-lessons-text">
            {{ filter !== 'all' ? $t('topicOverview.tryChangingFilter') : $t('topicOverview.noLessonsInTopic') }}
          </p>
        </div>

        <div v-else class="lessons-grid">
          <div
            v-for="(lesson, index) in filteredLessons"
            :key="`${lesson._id}-${language}`"
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
                {{ $t('topicOverview.premium') }}
              </span>
              <span v-else>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                </svg>
                {{ $t('topicOverview.free') }}
              </span>
            </div>

            <div class="lesson-content">
              <h3 class="lesson-title">{{ getLessonName(lesson) }}</h3>
              <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>

              <!-- Progress bar -->
              <div v-if="lesson.progress || currentUser" class="lesson-progress">
                <div class="progress-info">
                  <span class="progress-label">
                    {{ lesson.progress?.completed ? $t('topicOverview.completed') :
                       lesson.progress?.progressPercent > 0 ? $t('topicOverview.inProgress') : $t('topicOverview.notStarted') }}
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
                  {{ lesson.steps.length }} {{ $t('topicOverview.steps') }}
                </span>
                <span v-if="lesson.metadata?.estimatedDuration" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ lesson.metadata.estimatedDuration }} min
                </span>
                <span v-if="lesson.homework?.totalExercises > 0" class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  {{ lesson.homework.totalExercises }} {{ $t('topicOverview.exercises') }}
                </span>
                <span v-if="lesson.progress?.duration" class="meta-item time-spent">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ formatDuration(lesson.progress.duration) }} {{ $t('topicOverview.timeSpent') }}
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
                  🔒 {{ $t('topicOverview.subscriptionRequired') }}
                </span>
                <span v-else-if="lesson.progress?.completed">
                  ✅ {{ $t('topicOverview.takeAgain') }}
                </span>
                <span v-else-if="lesson.progress?.progressPercent > 0">
                  ▶️ {{ $t('topicOverview.continueLesson') }}
                </span>
                <span v-else>
                  🚀 {{ $t('topicOverview.startLesson') }}
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
          <h3 class="action-title">{{ $t('topicOverview.readyToStart') }}</h3>
          <p class="action-description">
            {{ reactiveAvailableCount > 0
              ? $t('topicOverview.accessToLessons', { available: reactiveAvailableCount, total: lessons.length })
              : $t('topicOverview.subscribeToAccess')
            }}
          </p>
          <div class="action-buttons">
            <button
              v-if="reactiveAvailableCount > 0"
              @click="startFirstLesson"
              class="btn btn-primary btn-start"
            >
              🚀 {{ $t('topicOverview.startFirstLesson') }}
            </button>
            <button
              v-else
              @click="handleSubscription"
              class="btn btn-premium btn-start"
            >
              ⭐ {{ $t('topicOverview.subscribe') }}
            </button>
            <button
              @click="navigateToProfile"
              class="btn btn-secondary"
            >
              📚 {{ $t('topicOverview.otherCourses') }}
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
import { useLanguage, getLocalizedText } from '@/composables/useLanguage';

export default {
  name: 'TopicOverview',

  setup() {
    const { language } = useLanguage();
    return { language };
  },

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
        'start': 'Pro',
        'premium': 'Pro',
        'free': 'Free'
      };
      return labels[plan] || 'Free';
    }
  },
  
  watch: {
    // Watch for language changes to update displayed text reactively
    language() {
      this.triggerReactivityUpdate();
    },

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
this.loading = false; 
    }
  },
  
  methods: {
    // Navigate to profile catalogue method
    navigateToProfile() {
      try {
        this.$router.push({ name: 'CataloguePage' });
      } catch (error) {
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
this.error = this.handleError(error, 'component initialization');
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
          // Fallback to individual loading
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
        return `${seconds || 0}s`;
      }
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (remainingSeconds === 0) {
        return `${minutes}m`;
      }
      
      return `${minutes}m ${remainingSeconds}s`;
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
        this.error = 'Topic ID not specified in URL';
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
this.error = this.handleError(err, 'loading topic');
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
        
        subject: this.extractLocalizedSubject(rawData.subject) || 'General',
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
return null;
      }
      if (!normalized.name || normalized.name === 'Untitled') {
          normalized.name = `Topic ${normalized._id?.substring(0, 8) || ''}`;
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

      if (!normalized.lessonName || normalized.lessonName === 'Untitled') {
          normalized.lessonName = `Lesson ${index + 1} (${normalized._id.substring(0, 8)})`;
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
            }
          } catch (apiError) {
            // Fallback to free
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
      if (!data) return 'Untitled';
      
      if (typeof data.name === 'string' && data.name.trim()) {
        return data.name.trim();
      }
      
      if (typeof data.name === 'object' && data.name !== null) {
        const localized = data.name[this.language] || data.name.en || data.name.ru || data.name.uz;
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
          const localized = data[field][this.language] || data[field].en || data[field].ru || data[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }
      
      return 'Untitled';
    },

    // Extract localized subject from object or string
    extractLocalizedSubject(subject) {
      if (!subject) return '';
      if (typeof subject === 'string') return subject.trim();
      if (typeof subject === 'object' && subject !== null) {
        const localized = subject[this.language] || subject.en || subject.ru || subject.uz;
        if (localized && typeof localized === 'string') return localized.trim();
        const values = Object.values(subject);
        for (const val of values) {
          if (val && typeof val === 'string') return val.trim();
        }
      }
      return '';
    },

    // Enhanced description extraction with fallbacks
    extractDescription(data) {
      if (!data) return 'No description';

      // Helper to extract localized subject
      const getLocalizedSubject = (subject) => {
        if (!subject) return '';
        if (typeof subject === 'string') return subject.trim();
        if (typeof subject === 'object' && subject !== null) {
          const localized = subject[this.language] || subject.en || subject.ru || subject.uz;
          if (localized && typeof localized === 'string') return localized.trim();
          const values = Object.values(subject);
          for (const val of values) {
            if (val && typeof val === 'string') return val.trim();
          }
        }
        return '';
      };

      // Helper to clean description that may contain [object Object] or needs translation
      const cleanDescription = (desc) => {
        if (!desc || typeof desc !== 'string') return desc;
        const subject = getLocalizedSubject(data.subject) || this.$t('common.general') || 'General';

        // Replace [object Object] with properly extracted subject
        if (desc.includes('[object Object]')) {
          return desc.replace(/\[object Object\]/g, subject);
        }

        // Detect and translate "Course with X lessons on Subject" pattern
        const coursePattern = /^Course with (\d+) lessons? on (.+)$/i;
        const match = desc.match(coursePattern);
        if (match) {
          const count = parseInt(match[1], 10);
          if (count === 1) {
            return this.$t('topicOverview.courseWithLesson', { subject });
          }
          return this.$t('topicOverview.courseWithLessons', { count, subject });
        }

        return desc;
      };

      if (typeof data.description === 'string' && data.description.trim()) {
        return cleanDescription(data.description.trim());
      }

      if (typeof data.description === 'object' && data.description !== null) {
        const localized = data.description[this.language] || data.description.en || data.description.ru || data.description.uz;
        if (localized && typeof localized === 'string' && localized.trim()) {
          return cleanDescription(localized.trim());
        }

        const values = Object.values(data.description);
        for (const value of values) {
          if (value && typeof value === 'string' && value.trim()) {
            return cleanDescription(value.trim());
          }
        }
      }

      const descFields = ['topicDescription', 'desc', 'summary', 'info'];
      for (const field of descFields) {
        if (typeof data[field] === 'string' && data[field].trim()) {
          return cleanDescription(data[field].trim());
        }
        if (typeof data[field] === 'object' && data[field] !== null) {
          const localized = data[field][this.language] || data[field].en || data[field].ru || data[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return cleanDescription(localized.trim());
          }
        }
      }

      return 'No description for this topic.';
    },
    
    // Enhanced lesson name extraction with more robust checks
    extractLessonName(lesson) {
      if (!lesson) return 'Untitled';
      
      const nameFields = ['lessonName', 'title', 'name'];
      
      for (const field of nameFields) {
        if (typeof lesson[field] === 'string' && lesson[field].trim()) {
          return lesson[field].trim();
        }
        if (typeof lesson[field] === 'object' && lesson[field] !== null) {
          const localized = lesson[field][this.language] || lesson[field].en || lesson[field].ru || lesson[field].uz;
          if (localized && typeof localized === 'string' && localized.trim()) {
            return localized.trim();
          }
        }
      }

      if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
      }
      if (typeof lesson.topic === 'object' && lesson.topic !== null) {
          const localizedTopic = lesson.topic[this.language] || lesson.topic.en || lesson.topic.ru || lesson.topic.uz;
          if (localizedTopic && typeof localizedTopic === 'string' && localizedTopic.trim()) {
              return localizedTopic.trim();
          }
      }
      
      return 'Untitled';
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
          const localized = lesson[field][this.language] || lesson[field].en || lesson[field].ru || lesson[field].uz;
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
    handleError(error, context = 'operation') {
let errorMessage = `An error occurred during ${context}. Please try again.`;

      if (error.response) {
        switch (error.response.status) {
          case 400: errorMessage = `Bad request: ${error.response.data?.message || 'check your data.'}`; break;
          case 401: errorMessage = 'You need to log in. Please refresh the page or log in again.'; break;
          case 403: errorMessage = 'Access denied. You do not have permission for this operation.'; break;
          case 404: errorMessage = 'Resource not found. It may have been deleted or moved.'; break;
          case 429: errorMessage = 'Too many requests. Please wait a moment and try again.'; break;
          case 500: case 502: case 503: case 504:
            errorMessage = 'Server error. We are already working to fix the problem. Please try again later.'; break;
          default:
            errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'unknown error.'}`; break;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Check your internet connection.';
      } else if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout exceeded. Please try again later.';
        } else if (error.message.includes('Topic ID not specified')) {
          errorMessage = 'Topic ID not provided. Check the page URL.';
        } else if (error.message.includes('Invalid topic data received')) {
          errorMessage = 'Invalid topic data received from server. Contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (this.isDevelopment) {
}

      return errorMessage;
    },
    
    // Better retry logic with exponential backoff
    async retryLoad() {
      this.retryCount++;
      
      if (this.retryCount > 3) {
        this.error = 'Maximum number of retries exceeded. Please refresh the page.';
        this.loading = false;
        return;
      }
      
      const delay = Math.pow(2, this.retryCount - 1) * 1000; 
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await this.initializeComponent();
    },
    
    // Better topic name getter
    getTopicName(topic) {
      if (!topic) return 'Untitled';
      return this.extractName(topic);
    },
    
    // Better topic description getter
    getTopicDescription(topic) {
      if (!topic) return 'No description for this topic.';
      return this.extractDescription(topic);
    },
    
    // Better lesson name getter
    getLessonName(lesson) {
      if (!lesson) return 'Untitled';
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
this.error = 'Error: invalid lesson or missing ID.';
          return;
        }
        
        if ((lesson.type === 'premium' || lesson.type === 'pro') && !this.isPremiumUser) {
          this.handleSubscription();
          return;
        }
        
        const lessonId = lesson._id || lesson.id;
        
        this.$router.push({ name: 'LessonPage', params: { id: lessonId } });
        
      } catch (error) {
this.error = 'Error starting lesson';
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
this.error = 'Error starting first lesson';
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
window.location.href = '/payment/start';
        });
      } catch (error) {
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
        }
        
      } catch (error) {
        // Silent fail
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
          // Silent fail
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
      // Silent fail
    }
  },
  
  // Lifecycle hook for comprehensive cleanup
  beforeUnmount() {
    this.cleanup();
  },
  
  // Error boundary for template errors
  errorCaptured(err, vm, info) {

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
/* ========================================
TOPIC OVERVIEW - CLEAN REDESIGN
======================================== */

.topic-overview {
  min-height: 100vh;
  background: #fafafa;
}

/* ========================================
LOADING & ERROR STATES
======================================== */

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #f3f4f6;
  border-left-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  text-align: center;
  max-width: 500px;
}

.debug-info {
  margin-top: 2rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  text-align: left;
  max-width: 600px;
  width: 100%;
}

.debug-info h4 {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.debug-info pre {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #374151;
}

/* ========================================
NAVIGATION
======================================== */

.nav-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.back-button svg {
  flex-shrink: 0;
}

/* ========================================
TOPIC CONTENT
======================================== */

.topic-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 3rem;
}

/* ========================================
TOPIC HEADER
======================================== */

.topic-header {
  padding: 2rem 0;
}

.topic-hero {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.topic-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.topic-info {
  flex: 1;
}

.topic-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.topic-description {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* ========================================
TOPIC STATS
======================================== */

.topic-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.375rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

/* ========================================
LESSONS SECTION
======================================== */

.lessons-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.section-icon {
  font-size: 1.125rem;
}

/* ========================================
LESSON FILTERS
======================================== */

.lesson-filters {
  display: flex;
  gap: 0.5rem;
  background: #f9fafb;
  padding: 0.375rem;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 0.875rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8125rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-btn:hover:not(.active) {
  color: #111827;
  background: rgba(255, 255, 255, 0.5);
}

/* ========================================
NO LESSONS STATE
======================================== */

.no-lessons {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.no-lessons-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-lessons-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.no-lessons-text {
  font-size: 0.875rem;
  margin: 0;
}

/* ========================================
LESSONS GRID
======================================== */

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* ========================================
LESSON CARD
======================================== */

.lesson-card {
  position: relative;
  background: #fafafa;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lesson-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.lesson-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.lesson-card.locked:hover {
  transform: none;
  border-color: #e5e7eb;
  box-shadow: none;
}

.lesson-card.premium {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.lesson-card.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.lesson-card.in-progress {
  border-color: #6366f1;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
}

.lesson-number {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
  z-index: 2;
}

.lesson-card.premium .lesson-number {
  background: #f59e0b;
}

.lesson-card.completed .lesson-number {
  background: #10b981;
}

/* ========================================
PROGRESS INDICATOR
======================================== */

.lesson-progress-indicator {
  position: absolute;
  top: 0.75rem;
  left: 1rem;
  z-index: 3;
}

.progress-circle {
  position: relative;
  width: 36px;
  height: 36px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.6875rem;
  font-weight: 700;
  color: #6366f1;
}

.progress-circle.completed .progress-text {
  color: #10b981;
  font-size: 0.875rem;
}

/* ========================================
LESSON BADGE
======================================== */

.lesson-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
}

.lesson-badge.free {
  background: #dcfce7;
  color: #065f46;
}

.lesson-badge.premium {
  background: #fef3c7;
  color: #92400e;
}

.lesson-badge svg {
  width: 12px;
  height: 12px;
}

/* ========================================
LESSON CONTENT
======================================== */

.lesson-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lesson-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
  padding-right: 2.5rem;
}

.lesson-description {
  color: #6b7280;
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0;
}

/* ========================================
LESSON PROGRESS BAR
======================================== */

.lesson-progress {
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.progress-percentage {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
}

.progress-bar {
  width: 100%;
  height: 5px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #6366f1;
  transition: width 0.5s ease;
  border-radius: 100px;
}

.progress-fill.completed {
  background: #10b981;
}

.progress-fill.in-progress {
  background: linear-gradient(90deg, #6366f1, #818cf8);
}

/* ========================================
LESSON STARS
======================================== */

.lesson-stars {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  justify-content: center;
}

.star {
  font-size: 0.75rem;
  opacity: 0.3;
}

.star.filled {
  opacity: 1;
}

/* ========================================
LESSON META
======================================== */

.lesson-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

.meta-item.time-spent {
  color: #059669;
}

.meta-item svg {
  flex-shrink: 0;
}

/* ========================================
LESSON ACTION BUTTON
======================================== */

.lesson-action {
  margin-top: auto;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.action-btn:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.action-btn.premium {
  background: #f59e0b;
}

.action-btn.premium:hover {
  background: #d97706;
}

.action-btn.completed {
  background: #10b981;
}

.action-btn.completed:hover {
  background: #059669;
}

.action-btn.continue {
  background: #6366f1;
}

.action-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-btn.locked {
  background: #9ca3af;
  cursor: not-allowed;
}

/* ========================================
LOCK OVERLAY
======================================== */

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
  border-radius: 12px;
  pointer-events: none;
}

.lock-icon {
  color: #6b7280;
  opacity: 0.6;
}

/* ========================================
ACTION SECTION
======================================== */

.action-section {
  background: white;
  padding: 2rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.action-content {
  max-width: 600px;
  margin: 0 auto;
}

.action-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.action-description {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ========================================
BUTTONS
======================================== */

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-premium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-back {
  background: #f3f4f6;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.btn-back:hover {
  background: #e5e7eb;
}

/* ========================================
RESPONSIVE
======================================== */

@media (max-width: 768px) {
  .nav-header {
    padding: 1rem 1.5rem;
  }

  .topic-content {
    padding: 0 1.5rem 2rem;
  }

  .topic-hero {
    flex-direction: column;
    gap: 1rem;
  }

  .topic-icon {
    font-size: 2rem;
  }

  .topic-title {
    font-size: 1.5rem;
  }

  .topic-description {
    font-size: 0.875rem;
  }

  .topic-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .lesson-filters {
    justify-content: center;
  }

  .lessons-grid {
    grid-template-columns: 1fr;
  }

  .lessons-section {
    padding: 1.25rem;
  }

  .action-section {
    padding: 1.5rem 1.25rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .topic-header {
    padding: 1.5rem 0;
  }

  .topic-title {
    font-size: 1.25rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .lesson-card {
    padding: 1rem;
  }

  .lesson-title {
    font-size: 0.9375rem;
  }

  .lesson-number {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }

  .filter-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .progress-circle {
    width: 32px;
    height: 32px;
  }

  .section-title {
    font-size: 1rem;
  }
}

/* ========================================
ACCESSIBILITY
======================================== */

.back-button:focus,
.action-btn:focus,
.btn:focus,
.filter-btn:focus,
.lesson-card:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>