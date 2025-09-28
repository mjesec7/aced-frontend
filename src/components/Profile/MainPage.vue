<template>
  <div class="dashboard">
    <h1 class="title">👋 Добро пожаловать обратно!</h1>
    <div class="filter-bar">
      <div class="filter-section">
        <div class="search-group">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input v-model="searchQuery" class="search-input" placeholder="Поиск курсов..." />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">×</button>
          </div>
        </div>
        
        <div class="filters-group">
          <select v-model="filterSubject" class="filter-select">
            <option value="">Все предметы</option>
            <option v-for="subject in allSubjects" :key="subject" :value="subject">{{ subject }}</option>
          </select>
          
          <select v-model="filterLevel" class="filter-select">
            <option value="">Все уровни</option>
            <option v-for="level in allLevels" :key="level" :value="level">Уровень {{ level }}</option>
          </select>
          
          <select v-model="filterType" class="filter-select">
            <option value="">Все типы</option>
            <option value="free">💚 Бесплатные</option>
            <option value="premium">💎 Премиум</option>
            <option value="pro">🌟 Pro</option>
          </select>
          
          <select v-model="filterProgress" class="filter-select">
            <option value="">Любой прогресс</option>
            <option value="not-started">⭕ Не начато</option>
            <option value="in-progress">🔄 В процессе</option>
            <option value="completed">✅ Завершено</option>
          </select>
          
          <select v-model="sortBy" class="filter-select">
            <option value="name">📝 По названию</option>
            <option value="progress">📊 По прогрессу</option>
            <option value="recent">🕒 Недавние</option>
            <option value="subject">🏷️ По предмету</option>
          </select>
        </div>
        
        <div class="actions-group">
          <button @click="refreshRecommendations" class="refresh-btn" :disabled="loadingRecommendations">
            <span class="refresh-icon" :class="{ 'spinning': loadingRecommendations }">🔄</span>
            <span>{{ loadingRecommendations ? 'Обновление...' : 'Обновить' }}</span>
          </button>
          <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-all-btn">
            🗑️ Очистить
          </button>
          <span v-if="safeUserStatus" class="user-badge" :class="safeUserStatus">{{ userStatusLabel }}</span>
        </div>
      </div>
      
      <div v-if="hasActiveFilters" class="active-filters-row">
        <span class="filter-tag" v-if="searchQuery" @click="searchQuery = ''">
          🔍 "{{ searchQuery }}" ×
        </span>
        <span class="filter-tag" v-if="filterSubject" @click="filterSubject = ''">
          🏷️ {{ filterSubject }} ×
        </span>
        <span class="filter-tag" v-if="filterLevel" @click="filterLevel = ''">
          📈 Уровень {{ filterLevel }} ×
        </span>
        <span class="filter-tag" v-if="filterType" @click="filterType = ''">
          {{ getTypeIcon(filterType) }} {{ getTypeLabel(filterType) }} ×
        </span>
        <span class="filter-tag" v-if="filterProgress" @click="filterProgress = ''">
          {{ getProgressIcon(filterProgress) }} {{ getProgressLabel(filterProgress) }} ×
        </span>
      </div>
    </div>

    <div v-if="hasErrors" class="error-alert">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-messages">
          <p v-if="errors.recommendations">{{ errors.recommendations }}</p>
          <p v-if="errors.studyList">{{ errors.studyList }}</p>
        </div>
        <button class="retry-btn" @click="retryAll">🔄 Retry</button>
      </div>
    </div>

    <div class="section recommendations-section">
      <div class="section-header">
        <h2>🌟 Рекомендовано для вас</h2>
        <div class="header-controls">
          <span class="results-count">{{ displayedRecommendations.length }} из {{ allRecommendations.length }}</span>
          <button class="refresh-recommendations-btn" @click="shuffleRecommendations" :disabled="loadingRecommendations">
            <span class="refresh-icon" :class="{ 'spinning': loadingRecommendations }">🎲</span>
            <span>Новые курсы</span>
          </button>
        </div>
      </div>

      <div v-if="loadingRecommendations" class="loading-carousel">
        <div class="recommendation-placeholder" v-for="n in 10" :key="n">⏳</div>
      </div>

      <div v-else-if="displayedRecommendations.length" class="recommendations-carousel">
        <button 
          class="carousel-nav prev" 
          @click="scrollCarousel('left')"
          :disabled="isAtStart"
          :class="{ disabled: isAtStart }"
        >
          ‹
        </button>
        
        <div class="carousel-container" ref="carouselContainer" @scroll="updateScrollPosition">
          <div class="carousel-track">
            <div 
              class="recommendation-card" 
              v-for="topic in displayedRecommendations" 
              :key="topic._id" 
              :class="getTopicTypeClass(topic)"
            >
              <div class="topic-badge" :class="getTopicType(topic)">
                <span class="badge-text">{{ getTopicTypeLabel(topic) }}</span>
              </div>

              <div class="topic-content">
                <h3 class="topic-title">{{ getTopicName(topic) }}</h3>
                <p class="topic-desc">{{ getTopicDescription(topic) }}</p>
                
                <div class="topic-stats">
                  <div class="stat-item">
                    <span class="stat-icon">📚</span>
                    <span class="stat-value">{{ topic.lessons?.length || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">⏱</span>
                    <span class="stat-value">{{ Math.round((topic.totalTime || 0) / 60) || 1 }}ч</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">📈</span>
                    <span class="stat-value">{{ topic.level || 1 }}</span>
                  </div>
                </div>
                
                <div class="subject-info">
                  <span class="subject-tag">{{ topic.subject || 'Общий' }}</span>
                </div>
                
                <div class="card-actions">
                  <button 
                    class="add-btn" 
                    @click="handleAddTopic(topic)"
                    :disabled="isInStudyList(topic)"
                    :title="isInStudyList(topic) ? 'Уже в списке' : 'Добавить в мои курсы'"
                  >
                    <span class="add-icon">{{ isInStudyList(topic) ? '✓' : '+' }}</span>
                    <span class="add-text">{{ isInStudyList(topic) ? 'Добавлено' : 'Добавить' }}</span>
                  </button>
                  <button 
                    class="start-btn" 
                    @click="handleStartTopic(topic)"
                    :class="getStartButtonClass(topic)"
                    :title="getStartButtonTitle(topic)"
                  >
                    <span class="start-icon">{{ getStartButtonIcon(topic) }}</span>
                    <span class="start-text">{{ getStartButtonText(topic) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          class="carousel-nav next" 
          @click="scrollCarousel('right')"
          :disabled="isAtEnd"
          :class="{ disabled: isAtEnd }"
        >
          ›
        </button>
      </div>

      <div v-else class="empty-message">
        <div class="empty-icon">🔍</div>
        <h3>Нет подходящих рекомендаций</h3>
        <p v-if="filterType || filterSubject || searchQuery">
          Попробуйте изменить фильтры поиска
        </p>
        <p v-else>
          Рекомендации появятся на основе ваших интересов
        </p>
        <button v-if="errors.recommendations" class="retry-btn inline" @click="fetchRecommendations">
          🔄 Попробовать снова
        </button>
        <button v-else-if="filterType || filterSubject || searchQuery" class="clear-filters-btn" @click="clearAllFilters">
          🗑️ Очистить фильтры
        </button>
      </div>
    </div>

    <div class="section study-section">
      <div class="section-header">
        <h2>📘 Мои курсы</h2>
        <div class="header-controls">
          <span class="results-count">{{ filteredStudyList.length }} активных</span>
          <button v-if="invalidTopicsCleanedUp > 0" class="info-badge">
            🧹 Очищено: {{ invalidTopicsCleanedUp }}
          </button>
        </div>
      </div>
      
      <div v-if="loadingStudyList" class="grid">
        <div class="study-placeholder" v-for="n in 3" :key="n">⏳</div>
      </div>

      <div v-else-if="filteredStudyList.length" class="grid">
        <StudyCard
          v-for="topic in filteredStudyList"
          :key="topic._id"
          :topic="topic"
          :progress="topic.progress || { percent: 0, medal: 'none' }"
          :lessons="topic.lessons || []"
          @deleted="removeStudyCard"
        />
      </div>

      <div v-else class="empty-message">
        <div class="empty-icon">📚</div>
        <h3>У вас пока нет активных курсов</h3>
        <p v-if="filterType || filterSubject || searchQuery">
          Нет курсов, соответствующих фильтрам
        </p>
        <p v-else>
          Добавьте курсы из рекомендаций или найдите их в каталоге
        </p>
        <div class="empty-actions">
          <button v-if="filterType || filterSubject || searchQuery" class="clear-filters-btn" @click="clearAllFilters">
            🗑️ Очистить фильтры
          </button>
          <router-link to="/profile/catalogue" class="browse-link">
            📚 Просмотреть каталог курсов
          </router-link>
        </div>
      </div>
    </div>

    <PaymentModal
      v-if="userId"
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="handlePaymentSuccess($event)"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import { 
  getTopics, 
  getTopicById, 
  getAllLessons, 
  getLessonsByTopic,
  getUserProgress,
  getUserStudyList,
  addToStudyList,
  removeFromStudyList 
} from '@/api';
import StudyCard from '@/components/Profile/StudyCard.vue';
import PaymentModal from '@/components/Modals/PaymentModal.vue';
import { eventBus } from '@/main.js';

export default {
  name: 'MainPage',
  components: { 
    StudyCard, 
    PaymentModal 
  },
  
  mixins: [userStatusMixin],
  
  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'ru',
      
      allRecommendations: [],
      displayedRecommendations: [],
      recommendationsLastFetch: null,
      recommendationsSource: null,
      
      studyList: [],
      studyListLastFetch: null,
      invalidTopicsCleanedUp: 0,
      
      allSubjects: [],
      allLevels: [],
      searchQuery: '',
      filterSubject: '',
      filterLevel: '',
      filterType: '',
      filterProgress: '',
      sortBy: 'name',
      
      loadingRecommendations: true,
      loadingStudyList: true,
      loadingOperations: {
        add: new Set(),
        start: new Set(),
        remove: new Set(),
        refresh: new Set()
      },
      
      isAtStart: true,
      isAtEnd: false,
      carouselScrollPosition: 0,
      
      showPaywall: false,
      requestedTopicId: null,
      
      errors: {
        recommendations: null,
        studyList: null,
        api: null
      },
      retryCount: 0,
      maxRetries: 3,
      lastErrorTime: null,
      
      notifications: [],
      notificationCounter: 0,
      maxNotifications: 5,
      
      performanceMetrics: {
        mountTime: null,
        lastDataFetch: null,
        totalApiCalls: 0,
        successfulOperations: 0,
        failedOperations: 0
      },
      
      config: {
        enableAutoRefresh: true,
        autoRefreshInterval: 300000,
        maxRecommendations: 10,
        enableNotifications: true,
        enableProgressTracking: true,
        enableAnalytics: import.meta.env.DEV
      },
      
      reactivityKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0,
      componentMounted: false,
      statusEventListeners: [],
      eventCleanupFunctions: [],
      
      // Safe user status tracking
      safeUserStatus: 'free',
      lastKnownUserStatus: 'free',
      userStatusUpdateTimer: null
    };
  },
  
  computed: {
    ...mapGetters('user', {
      vuexUserStatus: 'userStatus',
      vuexIsPremiumUser: 'isPremiumUser', 
      vuexIsStartUser: 'isStartUser',
      vuexIsProUser: 'isProUser',
      vuexIsFreeUser: 'isFreeUser',
      vuexHasActiveSubscription: 'hasActiveSubscription',
      vuexGetUser: 'getUser',
      vuexSubscriptionDetails: 'subscriptionDetails',
      vuexForceUpdateCounter: 'forceUpdateCounter'
    }),
    
    currentUserStatus() {
      // Safely get user status with multiple fallbacks and error handling
      try {
        const storeUser = this.$store?.state?.user;
        const storeStatus = storeUser?.subscriptionPlan || this.vuexUserStatus;
        const localStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
        const userObjectStatus = this.vuexGetUser?.subscriptionPlan;
        
        // Filter out invalid statuses
        const validStatuses = ['free', 'start', 'premium', 'pro'];
        const candidateStatuses = [storeStatus, localStatus, userObjectStatus]
          .filter(s => s && validStatuses.includes(String(s).toLowerCase()));
        
        const finalStatus = candidateStatuses[0] || 'free';
        
        // Update safe status if it changed
        if (finalStatus !== this.safeUserStatus) {
          this.updateSafeUserStatus(finalStatus);
        }
        
        return finalStatus;
      } catch (error) {
        return this.safeUserStatus || 'free';
      }
    },
    
    userStatusLabel() {
      const status = this.safeUserStatus || 'free';
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'premium': 'Start',
        'free': 'Free'
      };
      return labels[status] || 'Free';
    },
    
    filteredRecommendations() {
      try {
        if (!Array.isArray(this.displayedRecommendations)) {
          return [];
        }
        
        return this.applySorting(
          this.displayedRecommendations
            .filter(t => t?.lessons?.length > 0)
            .filter(t => this.passesAllFilters(t))
        );
      } catch (error) {
        console.error('❌ Error filtering recommendations:', error);
        return [];
      }
    },
    
    filteredStudyList() {
      try {
        if (!Array.isArray(this.studyList)) {
          return [];
        }
        
        return this.applySorting(
          this.studyList.filter(t => this.passesAllFilters(t))
        );
      } catch (error) {
        console.error('❌ Error filtering study list:', error);
        return [];
      }
    },
    
    hasActiveFilters() {
      return !!(
        this.searchQuery?.trim() || 
        this.filterSubject || 
        this.filterLevel || 
        this.filterType || 
        this.filterProgress
      );
    },
    
    hasErrors() {
      return !!(
        this.errors.recommendations || 
        this.errors.studyList || 
        this.errors.api
      );
    },
    
    hasData() {
      return this.allRecommendations.length > 0 || this.studyList.length > 0;
    },
    
    isLoading() {
      return this.loadingRecommendations || this.loadingStudyList;
    }
  },
  
  watch: {
    '$store.state.user': {
      handler(newUser) {
        this.handleStoreUserChange(newUser);
      },
      deep: true,
      immediate: false
    },

    vuexGetUser: {
      handler(newUser) {
        this.handleVuexUserChange(newUser);
      },
      deep: true,
      immediate: false
    },

    currentUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.handleUserStatusChange(newStatus, oldStatus);
        }
      },
      immediate: false
    }
  },
  
  async mounted() {
    const startTime = Date.now();
    
    try {
      this.performanceMetrics.mountTime = startTime;
      this.componentMounted = true;
      
      await this.validateUserAuthentication();
      await this.initializeSafeUserStatus();
      this.setupEnhancedEventListeners();
      await this.initializeDataLoading();
      
      if (this.config.enableAutoRefresh) {
        this.setupAutoRefresh();
      }
      
      if (this.config.enableAnalytics) {
        this.setupPerformanceMonitoring();
      }
      
      this.forceReactivityUpdate();
      
      const mountTime = Date.now() - startTime;
      
      if (this.config.enableNotifications && !this.hasErrors) {
        this.showNotification('Добро пожаловать! Данные загружены.', 'success', 3000);
      }
      
    } catch (error) {
      console.error('❌ MainPage mount error:', error);
      this.handleCriticalError(error, 'mount');
    }
  },
  
  beforeUnmount() {
    this.componentMounted = false;
    this.performCleanup();
  },
  
  methods: {
    async initializeSafeUserStatus() {
      try {
        // Get status from multiple sources safely
        const sources = [
          () => this.$store?.state?.user?.subscriptionPlan,
          () => localStorage.getItem('userStatus'),
          () => localStorage.getItem('plan'),
          () => this.vuexGetUser?.subscriptionPlan
        ];
        
        let detectedStatus = 'free';
        
        for (const getStatus of sources) {
          try {
            const status = getStatus();
            if (status && ['free', 'start', 'premium', 'pro'].includes(status)) {
              detectedStatus = status;
              break;
            }
          } catch (error) {
          }
        }
        
        this.updateSafeUserStatus(detectedStatus);
        ('✅ Safe user status initialized:', this.safeUserStatus);
        
      } catch (error) {
        console.error('❌ Error initializing safe user status:', error);
        this.safeUserStatus = 'free';
      }
    },

    updateSafeUserStatus(newStatus) {
      if (!newStatus || typeof newStatus !== 'string') {
        return;
      }
      
      const validStatuses = ['free', 'start', 'premium', 'pro'];
      const normalizedStatus = newStatus.toLowerCase();
      
      if (validStatuses.includes(normalizedStatus)) {
        const oldStatus = this.safeUserStatus;
        this.safeUserStatus = normalizedStatus;
        this.lastKnownUserStatus = normalizedStatus;
        
        // Clear any existing timer
        if (this.userStatusUpdateTimer) {
          clearTimeout(this.userStatusUpdateTimer);
        }
        
        // Debounced update to prevent excessive updates
        this.userStatusUpdateTimer = setTimeout(() => {
          if (oldStatus !== normalizedStatus) {
            this.$forceUpdate();
          }
        }, 100);
      }
    },

    handleStoreUserChange(newUser) {
      if (!this.componentMounted) return;
      
      try {
        const newPlan = newUser?.subscriptionPlan;
        if (newPlan && newPlan !== this.safeUserStatus) {
          this.handleUserStatusChange(newPlan, this.safeUserStatus);
        }
      } catch (error) {
      }
    },

    handleVuexUserChange(newUser) {
      if (!this.componentMounted) return;
      
      try {
        const newPlan = newUser?.subscriptionPlan;
        if (newPlan && newPlan !== this.safeUserStatus) {
          this.handleUserStatusChange(newPlan, this.safeUserStatus);
        }
      } catch (error) {
      }
    },

    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus || !this.componentMounted) return;


      try {
        localStorage.setItem('userStatus', newStatus);
        localStorage.setItem('plan', newStatus);

        this.updateSafeUserStatus(newStatus);
        this.forceReactivityUpdate();

        if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
          const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 ${planLabel} подписка активирована!`, 'success', 5000);
          
          setTimeout(() => {
            this.refreshAllData();
          }, 1000);
        }

      } catch (error) {
        console.error('❌ Error handling user status change:', error);
      }
    },

    setupEnhancedEventListeners() {
      
      this.cleanupEventListeners();
      
      if (typeof window !== 'undefined') {
        // Subscription change handler
        this.handleSubscriptionChange = (event) => {
          if (!this.componentMounted) return;
          
          try {
            const detail = event?.detail;
            if (detail && detail.plan) {
              this.handleUserStatusChange(detail.plan, detail.oldPlan || this.safeUserStatus);
            }
          } catch (error) {
          }
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        // Storage change handler
        this.handleStorageChange = (event) => {
          if (!this.componentMounted) return;
          
          try {
            if ((event.key === 'userStatus' || event.key === 'plan') && 
                event.newValue !== event.oldValue && event.newValue) {
              this.handleUserStatusChange(event.newValue, event.oldValue || this.safeUserStatus);
            }
          } catch (error) {
          }
        };
        
        window.addEventListener('storage', this.handleStorageChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('storage', this.handleStorageChange);
        });

        // Generic event handler with proper error handling
        const eventTypes = [
          'userStatusChanged',
          'subscriptionUpdated', 
          'promocodeApplied',
          'paymentCompleted',
          'globalForceUpdate',
          'reactivityUpdate'
        ];

        const handleGenericStatusChange = (event) => {
          if (!this.componentMounted) return;
          
          try {
            
            const detail = event?.detail;
            if (detail) {
              if (detail.plan || detail.newStatus) {
                const newStatus = detail.plan || detail.newStatus;
                this.handleUserStatusChange(newStatus, detail.oldPlan || detail.oldStatus || this.safeUserStatus);
              }
            }
            
            this.forceReactivityUpdate();
            
            // Check localStorage for updates
            const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
            if (currentStatus && currentStatus !== this.safeUserStatus) {
              this.handleUserStatusChange(currentStatus, this.safeUserStatus);
            }
          } catch (error) {
          }
        };

        eventTypes.forEach(eventType => {
          window.addEventListener(eventType, handleGenericStatusChange);
          this.statusEventListeners.push(() => {
            window.removeEventListener(eventType, handleGenericStatusChange);
          });
        });
      }

      // EventBus listeners with error handling
      if (typeof window !== 'undefined' && window.eventBus) {
        this.handleUserStatusEvent = (data) => {
          if (!this.componentMounted) return;
          
          try {
            const newStatus = data?.newStatus || data?.plan;
            const oldStatus = data?.oldStatus || data?.oldPlan || this.safeUserStatus;
            
            if (newStatus) {
              this.handleUserStatusChange(newStatus, oldStatus);
            }
          } catch (error) {
          }
        };

        this.handleForceUpdateEvent = () => {
          if (!this.componentMounted) return;
          
          try {
            this.forceReactivityUpdate();
            
            const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
            if (currentStatus && currentStatus !== this.safeUserStatus) {
              this.handleUserStatusChange(currentStatus, this.safeUserStatus);
            }
          } catch (error) {
          }
        };

        const eventBusEvents = [
          'userStatusChanged',
          'promocodeApplied', 
          'subscriptionUpdated',
          'paymentCompleted',
          'forceUpdate',
          'globalForceUpdate'
        ];

        eventBusEvents.forEach(eventType => {
          try {
            if (eventType.includes('Status') || eventType.includes('promocode') || 
                eventType.includes('payment') || eventType.includes('subscription')) {
              window.eventBus.on(eventType, this.handleUserStatusEvent);
              this.statusEventListeners.push(() => {
                window.eventBus.off(eventType, this.handleUserStatusEvent);
              });
            } else {
              window.eventBus.on(eventType, this.handleForceUpdateEvent);
              this.statusEventListeners.push(() => {
                window.eventBus.off(eventType, this.handleForceUpdateEvent);
              });
            }
          } catch (error) {
          }
        });

      }

      // Store subscription with error handling
      if (this.$store) {
        try {
          this.storeUnsubscribe = this.$store.subscribe((mutation) => {
            if (!this.componentMounted) return;
            
            try {
              if (this.isUserRelatedMutation(mutation)) {
                this.forceReactivityUpdate();
                
                if (mutation.payload && mutation.payload.subscriptionPlan) {
                  const newStatus = mutation.payload.subscriptionPlan;
                  if (newStatus !== this.safeUserStatus) {
                    this.handleUserStatusChange(newStatus, this.safeUserStatus);
                  }
                }
              }
            } catch (error) {
            }
          });
          
          this.statusEventListeners.push(() => {
            if (this.storeUnsubscribe) {
              this.storeUnsubscribe();
              this.storeUnsubscribe = null;
            }
          });
        } catch (error) {
        }
      }

    },

    isUserRelatedMutation(mutation) {
      const userMutations = [
        'setUser',
        'SET_USER', 
        'updateUser',
        'UPDATE_USER',
        'user/SET_USER_STATUS',
        'user/setUserStatus',
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE',
        'user/ADD_PROMOCODE'
      ];
      
      return userMutations.some(type => mutation.type.includes(type)) ||
             mutation.type.includes('user/') ||
             mutation.type.toLowerCase().includes('status') ||
             mutation.type.toLowerCase().includes('subscription') ||
             mutation.type.toLowerCase().includes('plan');
    },

    forceReactivityUpdate() {
      if (!this.componentMounted) return;
      
      try {
        this.reactivityKey++;
        this.lastUpdateTime = Date.now();
        this.forceUpdateCounter++;
        
        this.$forceUpdate();
        
        this.$nextTick(() => {
          if (this.componentMounted) {
            this.$forceUpdate();
          }
        });
        
        
      } catch (error) {
      }
    },

    cleanupEventListeners() {
      this.statusEventListeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
        }
      });
      this.statusEventListeners = [];
      
      if (this.storeUnsubscribe) {
        try {
          this.storeUnsubscribe();
        } catch (error) {
        }
        this.storeUnsubscribe = null;
      }
      
      if (this.userStatusUpdateTimer) {
        clearTimeout(this.userStatusUpdateTimer);
        this.userStatusUpdateTimer = null;
      }
    },

    async validateUserAuthentication() {
      
      const storedId = this.$store?.state?.firebaseUserId || 
                       localStorage.getItem('firebaseUserId') || 
                       localStorage.getItem('userId');
      
      if (!storedId) {
        this.showNotification('Необходимо войти в систему', 'warning');
        this.$router.push('/');
        throw new Error('Authentication required');
      }
      
      this.userId = storedId;
    },
    
    async initializeDataLoading() {
      
      const startTime = Date.now();
      
      const results = await Promise.allSettled([
        this.fetchRecommendations(),
        this.fetchStudyList()
      ]);
      
      const [recommendationsResult, studyListResult] = results;
      
      if (recommendationsResult.status === 'fulfilled') {
      } else {
        console.error('❌ Recommendations failed:', recommendationsResult.reason);
        this.performanceMetrics.failedOperations++;
      }
      
      if (studyListResult.status === 'fulfilled') {
      } else {
        console.error('❌ Study list failed:', studyListResult.reason);
        this.performanceMetrics.failedOperations++;
      }
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.lastDataFetch = Date.now();
      
      
      this.performanceMetrics.totalApiCalls += 2;
      if (!this.hasErrors) {
        this.performanceMetrics.successfulOperations++;
      }
    },
    
    setupAutoRefresh() {
      if (!this.config.enableAutoRefresh) return;
      
      
      this.autoRefreshInterval = setInterval(async () => {
        if (!document.hidden && this.hasData && this.componentMounted) {
          
          try {
            await Promise.allSettled([
              this.fetchRecommendations(),
              this.fetchStudyList()
            ]);
            
            
          } catch (error) {
          }
        }
      }, this.config.autoRefreshInterval);
      
      this.eventCleanupFunctions.push(() => {
        if (this.autoRefreshInterval) {
          clearInterval(this.autoRefreshInterval);
        }
      });
    },
    
    setupPerformanceMonitoring() {
      if (!this.config.enableAnalytics) return;
      
      
      this.handleVisibilityChange = () => {
        if (!this.componentMounted) return;
        
        if (document.hidden) {
        } else {
          setTimeout(() => {
            if (this.hasData && Date.now() - this.performanceMetrics.lastDataFetch > 60000) {
              this.refreshAllData();
            }
          }, 1000);
        }
      };
      
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.eventCleanupFunctions.push(() => {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      });
    },
    
    async fetchRecommendations() {
      const startTime = Date.now();
      
      try {
        this.loadingRecommendations = true;
        this.errors.recommendations = null;
        
        this.performanceMetrics.totalApiCalls++;
        
        let lessonsResult;
        try {
          lessonsResult = await getAllLessons();
          this.performanceMetrics.totalApiCalls++;
        } catch (apiError) {
          console.error('❌ getAllLessons failed:', apiError);
          return this.fetchRecommendationsFallback(); 
        }
        
        if (lessonsResult?.success && Array.isArray(lessonsResult.data) && lessonsResult.data.length > 0) {
          
          const topics = this.buildTopicsFromLessons(lessonsResult.data);
          
          if (topics.length > 0) {
            this.allRecommendations = topics;
            this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
            this.extractSubjectsAndLevels(this.allRecommendations);
            this.recommendationsSource = 'lessons';
            this.recommendationsLastFetch = Date.now();
            
            this.performanceMetrics.successfulOperations++;
            return;
          }
        }
        
        return this.fetchRecommendationsFallback();
        
      } catch (error) {
        console.error('❌ Fetch recommendations error:', error);
        this.handleApiError(error, 'recommendations');
        this.performanceMetrics.failedOperations++;
        this.allRecommendations = [];
        this.displayedRecommendations = [];
      } finally {
        this.loadingRecommendations = false;
        if (this.componentMounted) {
          this.$nextTick(() => {
            this.updateScrollPosition();
          });
        }
      }
    },
    
    async fetchRecommendationsFallback() {
      const startTime = Date.now();
      
      try {
        
        const topicsResult = await getTopics({ includeStats: true });
        this.performanceMetrics.totalApiCalls++;
        
        if (topicsResult?.success && Array.isArray(topicsResult.data) && topicsResult.data.length > 0) {
          (`📚 Found ${topicsResult.data.length} topics directly`);
          
          const enrichedTopics = await this.enrichTopicsWithLessons(
            topicsResult.data.slice(0, 20)
          );
          
          if (enrichedTopics.length > 0) {
            this.allRecommendations = enrichedTopics;
            this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
            this.extractSubjectsAndLevels(this.allRecommendations);
            this.recommendationsSource = 'topics';
            this.recommendationsLastFetch = Date.now();
            
            this.performanceMetrics.successfulOperations++;
            return;
          }
        }
        
        this.allRecommendations = [];
        this.displayedRecommendations = [];
        this.recommendationsSource = 'none';
        
      } catch (error) {
        console.error('❌ Fallback recommendations failed:', error);
        this.handleApiError(error, 'recommendations');
        this.performanceMetrics.failedOperations++;
        this.allRecommendations = [];
        this.displayedRecommendations = [];
        this.recommendationsSource = 'error';
      }
    },
    
    async fetchStudyList() {
      const startTime = Date.now();
      
      try {
        this.loadingStudyList = true;
        this.errors.studyList = null;
        this.invalidTopicsCleanedUp = 0;
        
        this.performanceMetrics.totalApiCalls++;
        
        if (!this.userId) {
          throw new Error('No user ID available for fetching study list');
        }
        
        const studyListResult = await getUserStudyList(this.userId);
        this.performanceMetrics.totalApiCalls++;
        
        if (!studyListResult?.success) {
          throw new Error(studyListResult?.error || 'Failed to load study list');
        }
        
        const studyListData = studyListResult.data;
        
        if (!Array.isArray(studyListData)) {
          this.studyList = [];
          this.studyListLastFetch = Date.now();
          return;
        }
        
        
        let userProgressData = [];
        try {
          const progressResult = await getUserProgress(this.userId);
          this.performanceMetrics.totalApiCalls++;
          
          if (progressResult?.success && Array.isArray(progressResult.data)) {
            userProgressData = progressResult.data;
          }
        } catch (progressError) {
        }
        
        const validTopics = [];
        const processingPromises = studyListData.map(async (entry) => {
          if (!entry?.topicId) {
            this.invalidTopicsCleanedUp++;
            return null;
          }
          
          try {
            const processedTopic = await this.processStudyListEntry(entry, userProgressData);
            return processedTopic;
          } catch (error) {
            console.error(`❌ Error processing topic ${entry.topicId}:`, error);
            this.invalidTopicsCleanedUp++;
            return null;
          }
        });
        
        const results = await Promise.allSettled(processingPromises);
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            validTopics.push(result.value);
          }
        });
        
        this.studyList = validTopics;
        this.extractSubjectsAndLevels(this.studyList);
        this.studyListLastFetch = Date.now();
        
        const loadTime = Date.now() - startTime;
        
        if (this.invalidTopicsCleanedUp > 0) {
        }
        
        this.performanceMetrics.successfulOperations++;
        
      } catch (error) {
        console.error('❌ Fetch study list error:', error);
        this.handleApiError(error, 'studyList');
        this.performanceMetrics.failedOperations++;
        this.studyList = [];
      } finally {
        this.loadingStudyList = false;
      }
    },

    hasTopicAccess(topic) {
      const topicType = this.getTopicType(topic);
      const currentStatus = this.safeUserStatus;
      
   
      
      if (topicType === 'free') return true;
      
      if (topicType === 'premium' && (currentStatus === 'start' || currentStatus === 'pro')) {
        return true;
      }
      
      if (topicType === 'pro' && currentStatus === 'pro') {
        return true;
      }
      
      return false;
    },

    checkTopicAccess(topicType, userStatus) {
      if (topicType === 'free') return true;
      if (topicType === 'premium' && (userStatus === 'start' || userStatus === 'pro')) return true;
      if (topicType === 'pro' && userStatus === 'pro') return true;
      return false;
    },

    getTopicName(topic) {
      if (!topic) {
        return 'Без названия';
      }
      
      try {
        const nameFields = ['name', 'topicName', 'topic', 'title'];
        
        for (const field of nameFields) {
          if (topic[field]) {
            if (typeof topic[field] === 'string' && topic[field].trim()) {
              return topic[field].trim();
            }
            
            if (typeof topic[field] === 'object' && topic[field] !== null) {
              const localizedName = this.extractLocalizedString(topic[field]);
              if (localizedName) {
                return localizedName;
              }
            }
          }
        }
        
        return this.generateTopicNameFallback(topic);
        
      } catch (error) {
        console.error('❌ Error in getTopicName:', error);
        return 'Ошибка названия';
      }
    },
    
    getTopicDescription(topic) {
      if (!topic) return 'Описание отсутствует';
      
      try {
        const descFields = ['description', 'topicDescription'];
        
        for (const field of descFields) {
          if (topic[field]) {
            if (typeof topic[field] === 'string' && topic[field].trim()) {
              return topic[field].trim();
            }
            if (typeof topic[field] === 'object' && topic[field] !== null) {
              const localizedDesc = this.extractLocalizedString(topic[field]);
              if (localizedDesc) {
                return localizedDesc;
              }
            }
          }
        }
        
        return this.generateTopicDescription(topic);
        
      } catch (error) {
        console.error('❌ Error in getTopicDescription:', error);
        return 'Описание отсутствует';
      }
    },

    getTopicType(topic) {
      if (!topic) return 'free';
      
      const type = topic.type || topic.accessType || topic.pricing || topic.plan || topic.tier;
      
      const normalizedType = String(type).toLowerCase();
      
      if (!normalizedType || normalizedType === 'free' || normalizedType === 'public') {
        return 'free';
      }
      
      if (normalizedType === 'premium' || normalizedType === 'paid' || 
          normalizedType === 'start' || normalizedType === 'starter') {
        return 'premium';
      }
      
      if (normalizedType === 'pro' || normalizedType === 'professional' || 
          normalizedType === 'advanced') {
        return 'pro';
      }
      
      return 'free';
    },

    getTopicTypeClass(topic) {
      return `topic-${this.getTopicType(topic)}`;
    },
    
    getTopicTypeIcon(topic) {
      const type = this.getTopicType(topic);
      const icons = { 
        free: '💚', 
        premium: '💎', 
        pro: '🌟' 
      };
      return icons[type] || '💚';
    },
    
    getTopicTypeLabel(topic) {
      const type = this.getTopicType(topic);
      const labels = { 
        free: 'Бесплатно', 
        premium: 'Премиум', 
        pro: 'Pro' 
      };
      return labels[type] || 'Бесплатно';
    },

    isInStudyList(topic) {
      return Array.isArray(this.studyList) && this.studyList.some(t => t._id === topic._id);
    },
    
    getStartButtonClass(topic) {
      const hasAccess = this.hasTopicAccess(topic);
      const topicType = this.getTopicType(topic);
      
      if (!hasAccess) return 'btn-restricted';
      if (topicType === 'pro') return 'btn-pro';
      if (topicType === 'premium') return 'btn-premium';
      return 'btn-free';
    },
    
    getStartButtonIcon(topic) {
      if (this.loadingOperations.start.has(topic._id)) return '⏳';
      if (!this.hasTopicAccess(topic)) return '🔒';
      return '🚀';
    },
    
    getStartButtonText(topic) {
      if (this.loadingOperations.start.has(topic._id)) return 'Открытие...';
      if (!this.hasTopicAccess(topic)) {
        const topicType = this.getTopicType(topic);
        return topicType === 'pro' ? 'Нужен Pro' : 'Нужен Start';
      }
      return 'Начать';
    },
    
    getStartButtonTitle(topic) {
      const hasAccess = this.hasTopicAccess(topic);
      
      if (!hasAccess) {
        return `Этот курс требует подписку ${this.getTopicTypeLabel(topic)}`;
      }
      
      return `Начать изучение курса "${this.getTopicName(topic)}"`;
    },

    async handleAddTopic(topic) {
      if (!topic?._id || this.loadingOperations.add.has(topic._id)) {
        return;
      }
      
      this.loadingOperations.add.add(topic._id);
      
      try {
        
        const studyListData = {
          topicId: topic._id,
          topic: this.getTopicName(topic),
          topicName: this.getTopicName(topic),
          name: this.getTopicName(topic),
          title: this.getTopicName(topic),
          subject: topic.subject || 'General',
          level: parseInt(topic.level) || 1,
          lessonCount: parseInt(topic.lessonCount || topic.lessons?.length || 0),
          totalTime: parseInt(topic.totalTime || this.calculateTopicTotalTime(topic)),
          type: topic.type || 'free',
          description: topic.description || this.getTopicDescription(topic),
          isActive: true,
          addedAt: new Date().toISOString(),
          lessons: topic.lessons || [],
          source: 'main-page-recommendations'
        };
        
        
        const result = await addToStudyList(this.userId, studyListData);
        this.performanceMetrics.totalApiCalls++;
        
        if (result?.success !== false) {
          const newStudyItem = {
            _id: topic._id,
            ...studyListData,
            progress: {
              percent: 0,
              medal: 'none',
              completedLessons: 0,
              totalLessons: topic.lessons?.length || 0,
              stars: 0,
              points: 0,
              averageStars: 0,
              estimatedTimeRemaining: studyListData.totalTime,
              completedTime: 0,
              totalTime: studyListData.totalTime
            },
            studyListEntry: {
              topicId: topic._id,
              createdAt: new Date().toISOString(),
              addedVia: 'main-page'
            },
            hasLessons: (topic.lessons?.length || 0) > 0,
            lastUpdated: new Date().toISOString()
          };
          
          this.studyList.push(newStudyItem);
          
          this.allRecommendations = this.allRecommendations.filter(t => t._id !== topic._id);
          this.displayedRecommendations = this.displayedRecommendations.filter(t => t._id !== topic._id);
          
          this.refillDisplayedRecommendations();
          
          this.performanceMetrics.successfulOperations++;
          
          this.showNotification('✅ Курс добавлен в ваш список!', 'success');
          
          setTimeout(() => {
            this.fetchStudyList();
          }, 1000);
          
        } else {
          throw new Error(result?.error || 'Failed to add topic to study list');
        }
        
      } catch (error) {
        console.error('❌ Add topic error:', error);
        this.performanceMetrics.failedOperations++;
        
        let errorMessage = 'Не удалось добавить курс';
        
        if (error.message?.includes('уже добавлен') || error.message?.includes('already exists')) {
          errorMessage = 'Этот курс уже добавлен в ваш список';
        } else if (error.message?.includes('authentication') || error.message?.includes('auth')) {
          errorMessage = 'Необходимо войти в аккаунт';
        } else if (error.message?.includes('network') || error.message?.includes('Network')) {
          errorMessage = 'Проблема с сетью. Проверьте подключение.';
        } else if (error.message?.includes('server') || error.response?.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
        }
        
        this.showNotification(errorMessage, 'error');
        
      } finally {
        this.loadingOperations.add.delete(topic._id);
      }
    },
    
    async handleStartTopic(topic) {
      if (!topic?._id || this.loadingOperations.start.has(topic._id)) {
        return;
      }
      
      this.loadingOperations.start.add(topic._id);
      
      try {
        
        const hasAccess = this.hasTopicAccess(topic);
        
        if (!hasAccess) {
          this.requestedTopicId = topic._id;
          this.showPaywall = true;
          return;
        }
        
        await this.$router.push({ 
          name: 'TopicOverview',
          params: { id: topic._id },
          query: { source: 'main-page-recommendations' }
        });
        
        this.performanceMetrics.successfulOperations++;
        
      } catch (error) {
        console.error('❌ Start topic error:', error);
        this.performanceMetrics.failedOperations++;
        this.showNotification('Не удалось открыть курс', 'error');
      } finally {
        this.loadingOperations.start.delete(topic._id);
      }
    },

    closePaywall() {
      this.showPaywall = false;
      this.requestedTopicId = null;
    },
    
    handlePaymentSuccess(newStatus) {
      
      this.handleUserStatusChange(newStatus, this.safeUserStatus);
      this.closePaywall();
      
      this.performanceMetrics.successfulOperations++;
      
      const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
      this.showNotification(
        `🎉 Поздравляем! ${planLabel} подписка активирована!`,
        'success',
        5000
      );
      
      if (this.requestedTopicId) {
        setTimeout(() => {
          const topic = this.allRecommendations.find(t => t._id === this.requestedTopicId) ||
                       this.studyList.find(t => t._id === this.requestedTopicId);
          
          if (topic && this.hasTopicAccess(topic)) {
            this.handleStartTopic(topic);
          }
        }, 1000);
      }
    },

    showNotification(message, type = 'info', duration = 4000) {
      if (!this.config.enableNotifications) return;
      
      const isDuplicate = this.notifications.some(n => 
        n.message === message && n.type === type && 
        Date.now() - n.timestamp < 1000
      );
      
      if (isDuplicate) return;
      
      const notification = {
        id: ++this.notificationCounter,
        message,
        type,
        icon: this.getNotificationIcon(type),
        timestamp: Date.now(),
        duration
      };
      
      if (this.notifications.length >= this.maxNotifications) {
        this.notifications.shift();
      }
      
      this.notifications.push(notification);
      
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, duration);
      
    },
    
    getNotificationIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || 'ℹ️';
    },
    
    dismissNotification(id) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    },

    performCleanup() {
      
      this.componentMounted = false;
      
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }
      
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
      
      this.cleanupEventListeners();
      
      this.eventCleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
        }
      });
      this.eventCleanupFunctions = [];
      
      this.loadingOperations.add.clear();
      this.loadingOperations.start.clear();
      this.loadingOperations.remove.clear();
      this.loadingOperations.refresh.clear();
      
      this.dismissAllNotifications();
      
      if (this.config.enableAnalytics) {
      }
      
    },

    dismissAllNotifications() {
      this.notifications = [];
    },

    extractLocalizedString(obj) {
      if (!obj || typeof obj !== 'object') return null;
      
      if (obj[this.lang] && typeof obj[this.lang] === 'string' && obj[this.lang].trim()) {
        return obj[this.lang].trim();
      }
      
      const fallbackLanguages = ['ru', 'en', 'uz'];
      for (const lang of fallbackLanguages) {
        if (obj[lang] && typeof obj[lang] === 'string' && obj[lang].trim()) {
          return obj[lang].trim();
        }
      }
      
      const stringValue = Object.values(obj).find(val => 
        val && typeof val === 'string' && val.trim()
      );
      
      return stringValue ? stringValue.trim() : null;
    },
    
    generateTopicNameFallback(topic) {
      if (topic.subject) {
        const subject = typeof topic.subject === 'string' ? topic.subject : String(topic.subject);
        const level = topic.level ? ` (Уровень ${topic.level})` : '';
        return `${subject}${level}`;
      }
      
      if (topic.metadata?.source === 'built-from-lessons' && topic.lessons?.length > 0) {
        const firstLesson = topic.lessons[0];
        if (firstLesson.lessonName) {
          return `Курс: ${firstLesson.lessonName}`;
        }
        if (firstLesson.title) {
          return `Курс: ${firstLesson.title}`;
        }
      }
      
      if (topic._id || topic.id) {
        const id = (topic._id || topic.id).toString();
        return `Курс ${id.substring(Math.max(0, id.length - 6))}`;
      }
      
      return 'Без названия';
    },
    
    generateTopicDescription(topic) {
      const topicName = this.getTopicName(topic);
      const lessonCount = topic.lessonCount || topic.lessons?.length || 0;
      const subject = topic.subject || 'Общий предмет';
      const level = topic.level || 1;
      
      if (lessonCount > 0) {
        return `Курс "${topicName}" по предмету "${subject}" (Уровень ${level}) содержит ${lessonCount} уроков.`;
      } else {
        return `Курс "${topicName}" по предмету "${subject}" (Уровень ${level}).`;
      }
    },

    calculateLessonTime(lesson) {
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      if (lesson.timeToComplete) return parseInt(lesson.timeToComplete);
      
      return 10;
    },
    
    calculateTopicTotalTime(topic) {
      if (topic.totalTime) return parseInt(topic.totalTime);
      if (topic.lessons?.length) {
        return topic.lessons.reduce((sum, lesson) => sum + this.calculateLessonTime(lesson), 0);
      }
      return (topic.lessonCount || 1) * 10;
    },

    findStartingLesson(topic) {
      if (!topic.lessons || topic.lessons.length === 0) return null;
      
      const lessons = [...topic.lessons];
      
      if (lessons[0].order !== undefined) {
        lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      
      return lessons.find(lesson => lesson && lesson._id) || null;
    },

    passesAllFilters(topic) {
      try {
        const name = this.getTopicName(topic);
        const description = this.getTopicDescription(topic);
        const topicType = this.getTopicType(topic);
        const progress = topic.progress?.percent || 0;
        
        if (this.searchQuery?.trim()) {
          const query = this.searchQuery.toLowerCase();
          const searchTargets = [
            name.toLowerCase(),
            description.toLowerCase(),
            (topic.subject || '').toLowerCase()
          ];
          
          const matchesSearch = searchTargets.some(target => target.includes(query));
          if (!matchesSearch) return false;
        }
        
        if (this.filterSubject && topic.subject !== this.filterSubject) {
          return false;
        }
        
        if (this.filterLevel) {
          const topicLevel = parseInt(topic.level) || 1;
          const filterLevel = parseInt(this.filterLevel);
          if (topicLevel !== filterLevel) return false;
        }
        
        if (this.filterType && topicType !== this.filterType) {
          return false;
        }
        
        if (this.filterProgress && topic.progress) {
          switch (this.filterProgress) {
            case 'not-started':
              if (progress !== 0) return false;
              break;
            case 'in-progress':
              if (progress === 0 || progress === 100) return false;
              break;
            case 'completed':
              if (progress !== 100) return false;
              break;
          }
        }
        
        return true;
        
      } catch (error) {
        console.error('❌ Error in passesAllFilters:', error);
        return true;
      }
    },
    
    applySorting(items) {
      if (!Array.isArray(items)) return [];
      
      try {
        const sorted = [...items];
        
        switch (this.sortBy) {
          case 'name':
            return sorted.sort((a, b) => 
              this.getTopicName(a).localeCompare(this.getTopicName(b), 'ru')
            );
          
          case 'progress':
            return sorted.sort((a, b) => 
              (b.progress?.percent || 0) - (a.progress?.percent || 0)
            );
          
          case 'recent':
            return sorted.sort((a, b) => {
              const aDate = new Date(a.createdAt || a.studyListEntry?.createdAt || a.lastUpdated || 0);
              const bDate = new Date(b.createdAt || b.studyListEntry?.createdAt || b.lastUpdated || 0);
              return bDate - aDate;
            });
          
          case 'subject':
            return sorted.sort((a, b) => 
              (a.subject || '').localeCompare(b.subject || '', 'ru')
            );
          
          case 'level':
            return sorted.sort((a, b) => 
              (parseInt(a.level) || 0) - (parseInt(b.level) || 0)
            );
          
          default:
            return sorted;
        }
        
      } catch (error) {
        console.error('❌ Error in applySorting:', error);
        return items;
      }
    },
    
    clearAllFilters() {
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
      this.filterType = '';
      this.filterProgress = '';
      this.sortBy = 'name';
      
      this.showNotification('Фильтры очищены', 'info');
    },
    
    getTypeIcon(type) {
      const icons = { 
        free: '💚', 
        premium: '💎', 
        pro: '🌟' 
      };
      return icons[type] || '';
    },
    
    getTypeLabel(type) {
      const labels = { 
        free: 'Бесплатные', 
        premium: 'Премиум', 
        pro: 'Pro' 
      };
      return labels[type] || '';
    },
    
    getProgressIcon(progress) {
      const icons = { 
        'not-started': '⭕', 
        'in-progress': '🔄', 
        'completed': '✅' 
      };
      return icons[progress] || '';
    },
    
    getProgressLabel(progress) {
      const labels = { 
        'not-started': 'Не начато', 
        'in-progress': 'В процессе', 
        'completed': 'Завершено' 
      };
      return labels[progress] || '';
    },

    getRandomRecommendations(count = 10) {
      if (!Array.isArray(this.allRecommendations) || this.allRecommendations.length <= count) {
        return [...(this.allRecommendations || [])];
      }
      
      const shuffled = [...this.allRecommendations];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled.slice(0, count);
    },
    
    shuffleRecommendations() {
      if (!Array.isArray(this.allRecommendations) || this.allRecommendations.length === 0) {
        this.fetchRecommendations();
        return;
      }
      
      
      this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
      
      if (this.componentMounted) {
        this.$nextTick(() => {
          if (this.$refs.carouselContainer) {
            this.$refs.carouselContainer.scrollLeft = 0;
            this.updateScrollPosition();
          }
        });
      }
      
      this.showNotification('Новые рекомендации загружены', 'info', 2000);
    },
    
    scrollCarousel(direction) {
      const container = this.$refs.carouselContainer;
      if (!container) return;
      
      const scrollAmount = 320;
      const currentScroll = container.scrollLeft;
      
      const targetScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        this.updateScrollPosition();
      }, 300);
    },
    
    updateScrollPosition() {
      const container = this.$refs.carouselContainer;
      if (!container) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      this.isAtStart = scrollLeft <= 10;
      this.isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
      this.carouselScrollPosition = scrollLeft;
    },
    
    refillDisplayedRecommendations() {
      if (!Array.isArray(this.displayedRecommendations) || !Array.isArray(this.allRecommendations)) {
        return;
      }
      
      const currentCount = this.displayedRecommendations.length;
      const targetCount = this.config.maxRecommendations;
      
      if (currentCount < targetCount && this.allRecommendations.length > currentCount) {
        const needed = Math.min(targetCount - currentCount, 
                               this.allRecommendations.length - currentCount);
        
        const available = this.allRecommendations.filter(t => 
          !this.displayedRecommendations.some(d => d._id === t._id)
        );
        
        const additional = available.slice(0, needed);
        this.displayedRecommendations.push(...additional);
        
      }
    },

    async refreshRecommendations() {
      if (this.loadingOperations.refresh.has('recommendations')) return;
      
      this.loadingOperations.refresh.add('recommendations');
      
      try {
        await this.fetchRecommendations();
        this.showNotification('Рекомендации обновлены', 'success');
      } catch (error) {
        console.error('❌ Manual refresh recommendations failed:', error);
        this.showNotification('Не удалось обновить рекомендации', 'error');
      } finally {
        this.loadingOperations.refresh.delete('recommendations');
      }
    },
    
    async refreshStudyList() {
      if (this.loadingOperations.refresh.has('studyList')) return;
      
      this.loadingOperations.refresh.add('studyList');
      
      try {
        await this.fetchStudyList();
        this.showNotification('Список курсов обновлен', 'success');
      } catch (error) {
        console.error('❌ Manual refresh study list failed:', error);
        this.showNotification('Не удалось обновить список курсов', 'error');
      } finally {
        this.loadingOperations.refresh.delete('studyList');
      }
    },
    
    async refreshAllData() {
      if (this.loadingOperations.refresh.has('all')) return;
      
      this.loadingOperations.refresh.add('all');
      
      try {
        
        await Promise.allSettled([
          this.fetchRecommendations(),
          this.fetchStudyList()
        ]);
        
        this.showNotification('Все данные обновлены', 'success');
        
      } catch (error) {
        console.error('❌ Refresh all data failed:', error);
        this.showNotification('Не удалось обновить данные', 'error');
      } finally {
        this.loadingOperations.refresh.delete('all');
      }
    },
    
    async retryAll() {
      if (this.retryCount >= this.maxRetries) {
        this.showNotification('Превышено максимальное количество попыток', 'error');
        return;
      }
      
      this.retryCount++;
      
      const promises = [];
      
      if (this.errors.recommendations) {
        promises.push(this.fetchRecommendations());
      }
      
      if (this.errors.studyList) {
        promises.push(this.fetchStudyList());
      }
      
      if (promises.length === 0) {
        this.showNotification('Нет ошибок для повтора', 'info');
        return;
      }
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed === 0) {
        this.showNotification('Данные успешно загружены', 'success');
        this.retryCount = 0;
      } else if (successful > 0) {
        this.showNotification('Некоторые данные загружены', 'warning');
      } else {
        this.showNotification('Не удалось загрузить данные', 'error');
      }
    },

    buildTopicsFromLessons(lessons) {
      if (!Array.isArray(lessons)) return [];
      
      const topicsMap = new Map();
      let processedCount = 0;
      
      lessons.forEach(lesson => {
        if (!lesson?.topicId) return;
        
        let topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;
        
        const topicName = this.getTopicNameFromLesson(lesson);
        if (!topicName) return;

        if (!topicsMap.has(topicId)) {
          topicsMap.set(topicId, {
            _id: topicId,
            id: topicId,
            name: topicName,
            topicName: topicName,
            topic: topicName,
            title: topicName,
            description: `Курс по теме "${topicName}"`,
            topicDescription: `Изучите ${topicName} с практическими упражнениями`,
            subject: lesson.subject || 'General',
            level: lesson.level || 1,
            type: lesson.type || 'free',
            lessons: [lesson],
            lessonCount: 1,
            totalTime: this.calculateLessonTime(lesson),
            isActive: true,
            hasLessons: true,
            createdAt: lesson.createdAt || new Date().toISOString(),
            updatedAt: lesson.updatedAt || new Date().toISOString(),
            metadata: {
              source: 'built-from-lessons',
              constructedAt: new Date().toISOString(),
              originalLessonCount: 1
            }
          });
          processedCount++;
        } else {
          const topic = topicsMap.get(topicId);
          topic.lessons.push(lesson);
          topic.lessonCount++;
          topic.totalTime += this.calculateLessonTime(lesson);
          topic.metadata.originalLessonCount++;
          
          topic.description = `Курс по теме "${topicName}" содержит ${topic.lessonCount} уроков`;
        }
      });
      
      
      return Array.from(topicsMap.values())
        .filter(topic => topic.lessons.length > 0)
        .map(topic => ({
          ...topic,
          difficulty: this.calculateTopicDifficulty(topic),
          hasFreeLessons: topic.lessons.some(l => (l.type || 'free') === 'free'),
          hasPremiumLessons: topic.lessons.some(l => l.type === 'premium' || l.type === 'start'),
          hasProLessons: topic.lessons.some(l => l.type === 'pro'),
        }))
        .sort((a, b) => {
          if (a.subject !== b.subject) {
            return a.subject.localeCompare(b.subject);
          }
          return (a.level || 0) - (b.level || 0);
        });
    },

    async enrichTopicsWithLessons(topics) {
      if (!Array.isArray(topics)) return [];
      
      
      const enrichmentPromises = topics.map(async (topic) => {
        try {
          const lessonsResult = await getLessonsByTopic(topic._id);
          this.performanceMetrics.totalApiCalls++;
          
          if (lessonsResult?.success && Array.isArray(lessonsResult.data) && lessonsResult.data.length > 0) {
            return {
              ...topic,
              lessons: lessonsResult.data,
              lessonCount: lessonsResult.data.length,
              totalTime: lessonsResult.data.reduce((sum, lesson) => sum + this.calculateLessonTime(lesson), 0),
              hasLessons: true,
              metadata: {
                source: 'enriched-topic',
                enrichedAt: new Date().toISOString()
              }
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const results = await Promise.allSettled(enrichmentPromises);
      
      const enrichedTopics = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      
      return enrichedTopics;
    },

    async processStudyListEntry(entry, userProgressData) {
      if (!entry?.topicId) return null;

      try {
        
        let topicData = {
          _id: entry.topicId,
          id: entry.topicId,
          name: entry.name || entry.topic || entry.topicName || entry.title || 'Unnamed Topic',
          topicName: entry.topicName || entry.name || entry.topic || entry.title || 'Unnamed Topic',
          topic: entry.topic || entry.name || entry.topicName || entry.title || 'Unnamed Topic',
          title: entry.title || entry.name || entry.topic || entry.topicName || 'Unnamed Topic',
          description: entry.description || this.generateTopicDescription(entry),
          topicDescription: entry.topicDescription || entry.description,
          subject: entry.subject || 'General',
          level: parseInt(entry.level) || 1,
          type: entry.type || 'free',
          lessonCount: parseInt(entry.lessonCount) || 0,
          totalTime: parseInt(entry.totalTime) || 10,
          isActive: entry.isActive !== false,
          createdAt: entry.createdAt || new Date().toISOString(),
          metadata: {
            source: 'study-list-entry',
            processedAt: new Date().toISOString(),
            originalEntry: { ...entry }
          }
        };
        
        try {
          const topicResult = await getTopicById(entry.topicId);
          this.performanceMetrics.totalApiCalls++;
          
          if (topicResult?.success && topicResult.data) {
            const freshData = topicResult.data;
            
            const shouldKeepStudyListNames = this.shouldPreserveStudyListNames(freshData);
            
            if (shouldKeepStudyListNames) {
              topicData = {
                ...freshData,
                name: topicData.name,
                topicName: topicData.topicName,
                topic: topicData.topic,
                title: topicData.title,
                description: freshData.description || topicData.description,
                studyListEntry: entry,
                metadata: {
                  ...topicData.metadata,
                  mergeStrategy: 'preserve-study-list-names',
                  freshDataAvailable: true
                }
              };
            } else {
              topicData = {
                ...topicData,
                ...freshData,
                name: freshData.name || topicData.name,
                topicName: freshData.topicName || topicData.topicName,
                topic: freshData.topic || topicData.topic,
                title: freshData.title || topicData.title,
                studyListEntry: entry,
                metadata: {
                  ...topicData.metadata,
                  mergeStrategy: 'use-fresh-data',
                  freshDataAvailable: true
                }
              };
            }
          }
        } catch (topicError) {
          topicData.metadata.freshDataAvailable = false;
          topicData.metadata.freshDataError = topicError.message;
        }
        
        let lessons = entry.lessons || [];
        
        if (lessons.length === 0) {
          try {
            const lessonsResult = await getLessonsByTopic(entry.topicId);
            this.performanceMetrics.totalApiCalls++;
            
            if (lessonsResult?.success && Array.isArray(lessonsResult.data)) {
              lessons = lessonsResult.data;
            }
          } catch (lessonsError) {
          }
        }
        
        const progress = this.calculateTopicProgress(lessons, userProgressData);
        
        const finalTopic = {
          ...topicData,
          lessons: lessons,
          lessonCount: lessons.length,
          totalTime: lessons.reduce((sum, lesson) => sum + this.calculateLessonTime(lesson), 0) || topicData.totalTime,
          progress: progress,
          hasLessons: lessons.length > 0,
          studyListEntry: entry,
          lastUpdated: new Date().toISOString()
        };
        
        return finalTopic;
        
      } catch (error) {
        console.error(`❌ Error processing study list entry ${entry.topicId}:`, error);
        return null;
      }
    },

    calculateTopicProgress(lessons, userProgressData) {
      if (!Array.isArray(lessons) || lessons.length === 0) {
        return {
          percent: 0,
          medal: 'none',
          completedLessons: 0,
          totalLessons: 0,
          stars: 0,
          points: 0,
          estimatedTimeRemaining: 0
        };
      }
      
      if (!Array.isArray(userProgressData)) {
        userProgressData = [];
      }
      
      let completedLessons = 0;
      let totalStars = 0;
      let totalPoints = 0;
      let totalTime = 0;
      let completedTime = 0;
      
      lessons.forEach(lesson => {
        const lessonTime = this.calculateLessonTime(lesson);
        totalTime += lessonTime;
        
        const progress = userProgressData.find(p => {
          const progressLessonId = p.lessonId?._id || p.lessonId;
          return progressLessonId?.toString() === lesson._id?.toString();
        });
        
        if (progress?.completed) {
          completedLessons++;
          completedTime += lessonTime;
          totalStars += progress.stars || 0;
          totalPoints += progress.points || 0;
        }
      });
      
      const progressPercent = Math.round((completedLessons / lessons.length) * 100);
      const estimatedTimeRemaining = Math.max(0, totalTime - completedTime);
      
      let medal = 'none';
      if (progressPercent === 100 && lessons.length > 0) {
        const avgStars = totalStars / lessons.length;
        if (avgStars >= 2.5) medal = 'gold';
        else if (avgStars >= 1.5) medal = 'silver';
        else medal = 'bronze';
      }
      
      return {
        percent: progressPercent,
        medal: medal,
        completedLessons: completedLessons,
        totalLessons: lessons.length,
        stars: totalStars,
        points: totalPoints,
        averageStars: completedLessons > 0 ? totalStars / completedLessons : 0,
        estimatedTimeRemaining: estimatedTimeRemaining,
        completedTime: completedTime,
        totalTime: totalTime
      };
    },

    extractSubjectsAndLevels(items) {
      if (!Array.isArray(items)) return;
      
      try {
        const subjects = new Set();
        const levels = new Set();
        
        items.forEach(item => {
          if (item.subject && typeof item.subject === 'string') {
            subjects.add(item.subject);
          }
          
          if (item.level && !isNaN(item.level)) {
            levels.add(parseInt(item.level));
          }
        });
        
        this.allSubjects = Array.from(subjects).sort((a, b) => a.localeCompare(b, 'ru'));
        this.allLevels = Array.from(levels).sort((a, b) => a - b);
        
        
      } catch (error) {
        console.error('❌ Error extracting subjects and levels:', error);
      }
    },

    handleApiError(error, context) {
      console.error(`❌ API Error [${context}]:`, error);
      
      this.lastErrorTime = Date.now();
      
      let errorMessage = 'Произошла неожиданная ошибка';
      
      if (error?.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 404:
            errorMessage = 'Ресурс не найден. Возможно, он был удален.';
            break;
          case 401:
            errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему заново.';
            setTimeout(() => {
              this.$router.push('/');
            }, 2000);
            break;
          case 403:
            errorMessage = 'Доступ запрещен. У вас может не быть прав доступа.';
            break;
          case 429:
            errorMessage = 'Слишком много запросов. Попробуйте позже.';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Ошибка сервера. Пожалуйста, попробуйте позже.';
            break;
          default:
            errorMessage = data?.message || `Ошибка сервера (${status})`;
        }
      } else if (error?.request) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (error?.message) {
        if (error.message.includes('toUpperCase')) {
          errorMessage = 'Ошибка конфигурации API. Обратитесь в поддержку.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время ожидания. Попробуйте позже.';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.errors[context] = errorMessage;
      
      if (context === 'api' || error?.response?.status >= 500) {
        this.showNotification(errorMessage, 'error');
      }
    },

    handleCriticalError(error, context) {
      console.error(`🚨 Critical error in ${context}:`, error);
      
      this.errors.api = `Критическая ошибка в ${context}: ${error.message}`;
      
      this.showNotification(
        'Произошла критическая ошибка. Попробуйте перезагрузить страницу.',
        'error',
        10000
      );
      
      this.performanceMetrics.failedOperations++;
    },

    extractTopicId(topicId) {
      if (!topicId) return null;
      
      if (typeof topicId === 'string') {
        return topicId;
      }
      
      if (typeof topicId === 'object' && topicId !== null) {
        return topicId._id || topicId.id || String(topicId);
      }
      
      return String(topicId);
    },

    getTopicNameFromLesson(lesson) {
      if (!lesson) return 'Без темы';
      
      try {
        if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
        }
        
        if (lesson.topic && typeof lesson.topic === 'object') {
          const localizedTopic = this.extractLocalizedString(lesson.topic);
          if (localizedTopic) {
            return localizedTopic;
          }
        }
        
        if (lesson.translations?.[this.lang]?.topic) {
          return String(lesson.translations[this.lang].topic).trim();
        }
        
        if (lesson.lessonName?.trim()) {
          return `Тема: ${lesson.lessonName.trim()}`;
        }
        
        if (lesson.title?.trim()) {
          return `Тема: ${lesson.title.trim()}`;
        }
        
        return 'Без темы';
        
      } catch (error) {
        console.error('❌ Error getting topic name from lesson:', error);
        return 'Без темы';
      }
    },

    shouldPreserveStudyListNames(freshData) {
      return !freshData.name && !freshData.topicName && 
             !freshData.topic && !freshData.title;
    },

    calculateTopicDifficulty(topic) {
      const level = parseInt(topic.level) || 1;
      
      if (level <= 2) return 1;
      if (level <= 4) return 2;
      if (level <= 6) return 3;
      return 4;
    },

    async removeStudyCard(topicId) {
      if (!topicId || this.loadingOperations.remove.has(topicId)) {
        return;
      }
      
      this.loadingOperations.remove.add(topicId);
      
      try {
        
        const topicToRemove = this.studyList.find(t => t._id === topicId);
        
        this.studyList = this.studyList.filter(topic => topic._id !== topicId);
        
        this.forceReactivityUpdate();
        
        try {
          const result = await removeFromStudyList(this.userId, topicId);
          this.performanceMetrics.totalApiCalls++;
          
          if (result?.success) {
            this.performanceMetrics.successfulOperations++;
          } else {
          }
        } catch (backendError) {
          this.performanceMetrics.failedOperations++;
          
          if (topicToRemove) {
            this.studyList.push(topicToRemove);
            this.forceReactivityUpdate();
            throw backendError;
          }
        }
        
        this.showNotification('Курс удален из списка', 'info');
        
      } catch (error) {
        console.error('❌ Remove study card error:', error);
        this.showNotification('Не удалось удалить курс', 'error');
        
        setTimeout(() => {
          this.fetchStudyList();
        }, 1000);
      } finally {
        this.loadingOperations.remove.delete(topicId);
      }
    }
  }
};
</script>

<style scoped>
@import "@/assets/css/MainPage.css";
</style>