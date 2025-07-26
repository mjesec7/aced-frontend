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
          <span class="user-badge" :class="currentUserStatus">{{ userStatusLabel }}</span>
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
  
  // ✅ ENHANCED: Add the comprehensive user status mixin
  mixins: [userStatusMixin],
  
  data() {
    return {
      // ============================================================================
      // 👤 USER & AUTHENTICATION DATA
      // ============================================================================
      userId: null,
      lang: localStorage.getItem('lang') || 'ru',
      
      // ============================================================================
      // 📚 RECOMMENDATIONS DATA
      // ============================================================================
      allRecommendations: [],
      displayedRecommendations: [],
      recommendationsLastFetch: null,
      recommendationsSource: null,
      
      // ============================================================================
      // 📖 STUDY LIST DATA
      // ============================================================================
      studyList: [],
      studyListLastFetch: null,
      invalidTopicsCleanedUp: 0,
      
      // ============================================================================
      // 🎛️ FILTER & SEARCH STATE
      // ============================================================================
      allSubjects: [],
      allLevels: [],
      searchQuery: '',
      filterSubject: '',
      filterLevel: '',
      filterType: '',
      filterProgress: '',
      sortBy: 'name',
      
      // ============================================================================
      // ⏳ LOADING STATES
      // ============================================================================
      loadingRecommendations: true,
      loadingStudyList: true,
      loadingOperations: {
        add: new Set(),
        start: new Set(),
        remove: new Set(),
        refresh: new Set()
      },
      
      // ============================================================================
      // 🎠 CAROUSEL STATE
      // ============================================================================
      isAtStart: true,
      isAtEnd: false,
      carouselScrollPosition: 0,
      
      // ============================================================================
      // 💳 MODAL & PAYWALL STATE
      // ============================================================================
      showPaywall: false,
      requestedTopicId: null,
      
      // ============================================================================
      // ❌ ERROR HANDLING STATE
      // ============================================================================
      errors: {
        recommendations: null,
        studyList: null,
        api: null
      },
      retryCount: 0,
      maxRetries: 3,
      lastErrorTime: null,
      
      // ============================================================================
      // 🔔 NOTIFICATION SYSTEM
      // ============================================================================
      notifications: [],
      notificationCounter: 0,
      maxNotifications: 5,
      
      // ============================================================================
      // 📊 PERFORMANCE & ANALYTICS
      // ============================================================================
      performanceMetrics: {
        mountTime: null,
        lastDataFetch: null,
        totalApiCalls: 0,
        successfulOperations: 0,
        failedOperations: 0
      },
      
      // ============================================================================
      // 🎯 FEATURE FLAGS & CONFIGURATION
      // ============================================================================
      config: {
        enableAutoRefresh: true,
        autoRefreshInterval: 300000,
        maxRecommendations: 10,
        enableNotifications: true,
        enableProgressTracking: true,
        enableAnalytics: import.meta.env.DEV
      },
      
      // ============================================================================
      // 🔄 REACTIVITY TRACKING
      // ============================================================================
      reactivityKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0,
      componentMounted: false,
      statusEventListeners: [],
      eventCleanupFunctions: []
    };
  },
  
  computed: {
    // ============================================================================
    // 👤 USER STATUS COMPUTED PROPERTIES (Enhanced with immediate reactivity)
    // ============================================================================
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser', 
      'isStartUser',
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'getUser',
      'subscriptionDetails',
      'forceUpdateCounter'
    ]),
    
    // ✅ FIXED: Reactive current user status with multiple data sources
    currentUserStatus() {
      // Try multiple sources to get the most up-to-date status
      const storeStatus = this.$store.state.user?.subscriptionPlan || this.$store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
      const userObjectStatus = this.getUser?.subscriptionPlan;
      
      // Use the most recent non-free status or fallback
      const statuses = [storeStatus, localStatus, userObjectStatus].filter(s => s && s !== 'free');
      const currentStatus = statuses[0] || storeStatus || localStatus || userObjectStatus || 'free';
      
      // Force reactivity with counter
      const updateKey = this.reactivityKey + this.forceUpdateCounter + this.lastUpdateTime;
      
      console.log('🔍 MainPage currentUserStatus:', {
        computed: currentStatus,
        store: storeStatus,
        local: localStatus,
        userObject: userObjectStatus,
        updateKey
      });
      
      return currentStatus;
    },
    
    // ✅ FIXED: User status label with immediate updates
    userStatusLabel() {
      const status = this.currentUserStatus;
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'free': 'Free'
      };
      return labels[status] || 'Free';
    },
    
    // ============================================================================
    // 📊 FILTERED DATA COMPUTED PROPERTIES
    // ============================================================================
    
    filteredRecommendations() {
      try {
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
        return this.applySorting(
          this.studyList.filter(t => this.passesAllFilters(t))
        );
      } catch (error) {
        console.error('❌ Error filtering study list:', error);
        return [];
      }
    },
    
    // ============================================================================
    // 🎛️ UI STATE COMPUTED PROPERTIES
    // ============================================================================
    
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
    },
    
    // ============================================================================
    // 📈 ANALYTICS COMPUTED PROPERTIES
    // ============================================================================
    
    totalTopicsAvailable() {
      return this.allRecommendations.length + this.studyList.length;
    },
    
    completionRate() {
      const completedCourses = this.studyList.filter(t => t.progress?.percent === 100).length;
      return this.studyList.length > 0 ? Math.round((completedCourses / this.studyList.length) * 100) : 0;
    },
    
    averageProgress() {
      if (this.studyList.length === 0) return 0;
      const totalProgress = this.studyList.reduce((sum, t) => sum + (t.progress?.percent || 0), 0);
      return Math.round(totalProgress / this.studyList.length);
    }
  },
  
  // ============================================================================
  // 🔄 WATCHERS
  // ============================================================================
  
  watch: {
    // ✅ FIXED: Watch the user object from store (same as Catalogue)
    '$store.state.user': {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          console.log('👤 MainPage: User plan changed:', oldPlan, '→', newPlan);
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // ✅ FIXED: Watch the getUser getter
    getUser: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          console.log('👤 MainPage: GetUser plan changed:', oldPlan, '→', newPlan);
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // ✅ FIXED: Watch localStorage changes
    currentUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log('📊 MainPage: Current user status changed:', oldStatus, '→', newStatus);
          this.forceReactivityUpdate();
          
          // Refresh data if status changed to premium
          if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
            setTimeout(() => {
              this.refreshAllData();
            }, 500);
          }
        }
      },
      immediate: true
    }
  },
  
  // ============================================================================
  // 🔄 LIFECYCLE HOOKS
  // ============================================================================
  
  async mounted() {
    const startTime = Date.now();
    console.log('📱 MainPage: Component mounting...');
    
    try {
      this.performanceMetrics.mountTime = startTime;
      
      await this.validateUserAuthentication();
      
      // ✅ CRITICAL: Setup event listeners BEFORE loading data
      this.setupEnhancedEventListeners();
      
      await this.initializeDataLoading();
      
      if (this.config.enableAutoRefresh) {
        this.setupAutoRefresh();
      }
      
      if (this.config.enableAnalytics) {
        this.setupPerformanceMonitoring();
      }
      
      // ✅ CRITICAL: Force initial reactivity update
      this.forceReactivityUpdate();
      
      const mountTime = Date.now() - startTime;
      console.log(`✅ MainPage: Mounted successfully in ${mountTime}ms`);
      
      if (this.config.enableNotifications && !this.hasErrors) {
        this.showNotification('Добро пожаловать! Данные загружены.', 'success', 3000);
      }
      
    } catch (error) {
      console.error('❌ MainPage mount error:', error);
      this.handleCriticalError(error, 'mount');
    }
  },
  
  beforeUnmount() {
    console.log('📱 MainPage: Component unmounting');
    this.performCleanup();
  },
  
  methods: {
    // ============================================================================
    // 🔄 STATUS CHANGE HANDLING
    // ============================================================================
    
    // ✅ FIXED: Handle user status changes
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;

      console.log(`👤 MainPage: Handling status change ${oldStatus} → ${newStatus}`);

      // Update localStorage immediately
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('plan', newStatus);

      // Trigger immediate reactivity update
      this.forceReactivityUpdate();

      // Show celebration for upgrades
      if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
        const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
        this.showNotification(`🎉 ${planLabel} подписка активирована!`, 'success', 5000);
        
        // Refresh recommendations and study list
        setTimeout(() => {
          this.refreshAllData();
        }, 1000);
      }

      console.log(`✅ MainPage: Status change handled: ${oldStatus} → ${newStatus}`);
    },

    // ✅ ENHANCED: Setup comprehensive event listeners
    setupEnhancedEventListeners() {
      console.log('🔧 MainPage: Setting up enhanced event listeners...');
      
      // Clear existing listeners
      this.cleanupEventListeners();
      
      // ===== DOM EVENT LISTENERS =====
      if (typeof window !== 'undefined') {
        // Listen for user subscription changes
        this.handleSubscriptionChange = (event) => {
          console.log('📡 MainPage: Subscription change received:', event.detail);
          const { plan, oldPlan } = event.detail;
          this.handleUserStatusChange(plan, oldPlan);
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        // Listen for localStorage changes (cross-tab sync)
        this.handleStorageChange = (event) => {
          if ((event.key === 'userStatus' || event.key === 'plan') && event.newValue !== event.oldValue) {
            console.log('📡 MainPage: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        };
        
        window.addEventListener('storage', this.handleStorageChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('storage', this.handleStorageChange);
        });

        // Additional comprehensive events
        const eventTypes = [
          'userStatusChanged',
          'subscriptionUpdated',
          'promocodeApplied',
          'paymentCompleted',
          'globalForceUpdate',
          'reactivityUpdate'
        ];

        const handleGenericStatusChange = (event) => {
          console.log('📡 MainPage: Generic status event received:', event.type, event.detail);
          this.forceReactivityUpdate();
          
          // Check localStorage for updates
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentUserStatus) {
            this.handleUserStatusChange(currentStatus, this.currentUserStatus);
          }
        };

        eventTypes.forEach(eventType => {
          window.addEventListener(eventType, handleGenericStatusChange);
          this.statusEventListeners.push(() => {
            window.removeEventListener(eventType, handleGenericStatusChange);
          });
        });
      }

      // ===== EVENT BUS LISTENERS =====
      if (typeof window !== 'undefined' && window.eventBus) {
        // User status change events
        this.handleUserStatusEvent = (data) => {
          console.log('📡 MainPage: User status event received:', data);
          this.handleUserStatusChange(data.newStatus || data.plan, data.oldStatus || data.oldPlan);
        };

        // Promocode applied events
        this.handlePromocodeEvent = (data) => {
          console.log('📡 MainPage: Promocode applied event:', data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        // Force update events
        this.handleForceUpdateEvent = () => {
          console.log('📡 MainPage: Force update event received');
          this.forceReactivityUpdate();
          
          // Also check for status updates
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentUserStatus) {
            this.handleUserStatusChange(currentStatus, this.currentUserStatus);
          }
        };

        // Register event bus listeners
        const eventBusEvents = [
          'userStatusChanged',
          'promocodeApplied', 
          'subscriptionUpdated',
          'paymentCompleted',
          'forceUpdate',
          'globalForceUpdate'
        ];

        eventBusEvents.forEach(eventType => {
          if (eventType.includes('Status') || eventType.includes('promocode') || eventType.includes('payment') || eventType.includes('subscription')) {
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
        });

        console.log('✅ MainPage: Event bus listeners registered');
      }

      // ===== STORE MUTATION LISTENER =====
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            console.log('📊 MainPage: Store mutation detected:', mutation.type);
            this.forceReactivityUpdate();
            
            // Check for status changes in mutation payload
            if (mutation.payload && mutation.payload.subscriptionPlan) {
              const newStatus = mutation.payload.subscriptionPlan;
              if (newStatus !== this.currentUserStatus) {
                this.handleUserStatusChange(newStatus, this.currentUserStatus);
              }
            }
          }
        });
        
        this.statusEventListeners.push(() => {
          if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
            this.storeUnsubscribe = null;
          }
        });
      }

      console.log('✅ MainPage: Enhanced event listeners setup complete');
    },

    // ✅ FIXED: Check if mutation is user-related
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

    // ✅ ENHANCED: Enhanced forceReactivityUpdate
    forceReactivityUpdate() {
      try {
        this.reactivityKey++;
        this.lastUpdateTime = Date.now();
        this.forceUpdateCounter++;
        
        // Multiple Vue reactivity triggers
        this.$forceUpdate();
        
        this.$nextTick(() => {
          this.$forceUpdate();
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 50);
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 200);
        });
        
        console.log('🔄 MainPage: Reactivity updated:', {
          reactivityKey: this.reactivityKey,
          lastUpdateTime: this.lastUpdateTime,
          currentPlan: this.currentUserStatus,
          forceUpdateCounter: this.forceUpdateCounter
        });
      } catch (error) {
        console.warn('⚠️ MainPage: Reactivity update failed:', error);
      }
    },

    // ✅ ENHANCED: Enhanced cleanup
    cleanupEventListeners() {
      this.statusEventListeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('⚠️ MainPage: Cleanup error:', error);
        }
      });
      this.statusEventListeners = [];
      
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
    },

    // ============================================================================
    // 🚀 INITIALIZATION METHODS
    // ============================================================================
    
    async validateUserAuthentication() {
      console.log('🔐 Validating user authentication...');
      
      const storedId = this.$store.state.firebaseUserId || 
                       localStorage.getItem('firebaseUserId') || 
                       localStorage.getItem('userId');
      
      if (!storedId) {
        console.warn('⚠️ No user ID found, redirecting to home');
        this.showNotification('Необходимо войти в систему', 'warning');
        this.$router.push('/');
        throw new Error('Authentication required');
      }
      
      this.userId = storedId;
      console.log('✅ User authentication validated:', this.userId);
    },
    
    async initializeDataLoading() {
      console.log('📊 Initializing data loading...');
      
      const startTime = Date.now();
      
      const results = await Promise.allSettled([
        this.fetchRecommendations(),
        this.fetchStudyList()
      ]);
      
      const [recommendationsResult, studyListResult] = results;
      
      if (recommendationsResult.status === 'fulfilled') {
        console.log('✅ Recommendations loaded successfully');
      } else {
        console.error('❌ Recommendations failed:', recommendationsResult.reason);
        this.performanceMetrics.failedOperations++;
      }
      
      if (studyListResult.status === 'fulfilled') {
        console.log('✅ Study list loaded successfully');
      } else {
        console.error('❌ Study list failed:', studyListResult.reason);
        this.performanceMetrics.failedOperations++;
      }
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.lastDataFetch = Date.now();
      
      console.log(`⚡ Data loading completed in ${loadTime}ms`);
      
      this.performanceMetrics.totalApiCalls += 2;
      if (!this.hasErrors) {
        this.performanceMetrics.successfulOperations++;
      }
    },
    
    setupAutoRefresh() {
      if (!this.config.enableAutoRefresh) return;
      
      console.log(`🔄 Setting up auto-refresh (${this.config.autoRefreshInterval}ms)`);
      
      this.autoRefreshInterval = setInterval(async () => {
        if (!document.hidden && this.hasData) {
          console.log('🔄 Auto-refreshing data...');
          
          try {
            await Promise.allSettled([
              this.fetchRecommendations(),
              this.fetchStudyList()
            ]);
            
            console.log('✅ Auto-refresh completed');
            
          } catch (error) {
            console.warn('⚠️ Auto-refresh failed:', error);
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
      
      console.log('📈 Setting up performance monitoring...');
      
      this.handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('📱 MainPage: Hidden');
        } else {
          console.log('📱 MainPage: Visible');
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
    
    // ============================================================================
    // 📊 DATA FETCHING METHODS
    // ============================================================================
    
    async fetchRecommendations() {
      const startTime = Date.now();
      
      try {
        this.loadingRecommendations = true;
        this.errors.recommendations = null;
        
        console.log('🔍 Fetching recommendations...');
        this.performanceMetrics.totalApiCalls++;
        
        let lessonsResult;
        try {
          lessonsResult = await getAllLessons();
          this.performanceMetrics.totalApiCalls++;
        } catch (apiError) {
          console.error('❌ getAllLessons failed:', apiError);
          return this.fetchRecommendationsFallback(); 
        }
        
        if (lessonsResult?.success && lessonsResult.data?.length > 0) {
          console.log(`📚 Got ${lessonsResult.data.length} lessons for building recommendations`);
          
          const topics = this.buildTopicsFromLessons(lessonsResult.data);
          
          if (topics.length > 0) {
            this.allRecommendations = topics;
            this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
            this.extractSubjectsAndLevels(this.allRecommendations);
            this.recommendationsSource = 'lessons';
            this.recommendationsLastFetch = Date.now();
            
            console.log(`✅ Built ${topics.length} recommendations from lessons in ${Date.now() - startTime}ms`);
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
        this.$nextTick(() => {
          this.updateScrollPosition();
        });
      }
    },
    
    async fetchRecommendationsFallback() {
      const startTime = Date.now();
      
      try {
        console.log('🔄 Fallback: Getting topics directly...');
        
        const topicsResult = await getTopics({ includeStats: true });
        this.performanceMetrics.totalApiCalls++;
        
        if (topicsResult?.success && topicsResult.data?.length > 0) {
          console.log(`📚 Found ${topicsResult.data.length} topics directly`);
          
          const enrichedTopics = await this.enrichTopicsWithLessons(
            topicsResult.data.slice(0, 20)
          );
          
          if (enrichedTopics.length > 0) {
            this.allRecommendations = enrichedTopics;
            this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
            this.extractSubjectsAndLevels(this.allRecommendations);
            this.recommendationsSource = 'topics';
            this.recommendationsLastFetch = Date.now();
            
            console.log(`✅ Loaded ${enrichedTopics.length} enriched topics in ${Date.now() - startTime}ms`);
            this.performanceMetrics.successfulOperations++;
            return;
          }
        }
        
        console.log('ℹ️ No recommendations available from any source');
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
        
        console.log('🔍 Fetching study list for user:', this.userId);
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
          console.log('ℹ️ No study list data or invalid format');
          this.studyList = [];
          this.studyListLastFetch = Date.now();
          return;
        }
        
        console.log(`📚 Found ${studyListData.length} study list entries`);
        
        let userProgressData = [];
        try {
          const progressResult = await getUserProgress(this.userId);
          this.performanceMetrics.totalApiCalls++;
          
          if (progressResult?.success) {
            userProgressData = progressResult.data || [];
            console.log(`📊 Loaded ${userProgressData.length} progress records`);
          }
        } catch (progressError) {
          console.warn('⚠️ Failed to load progress data:', progressError.message);
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
        console.log(`✅ Loaded ${validTopics.length} study list topics in ${loadTime}ms`);
        
        if (this.invalidTopicsCleanedUp > 0) {
          console.log(`🧹 Cleaned up ${this.invalidTopicsCleanedUp} invalid entries`);
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

    // ============================================================================
    // 🎯 TOPIC ACCESS CONTROL
    // ============================================================================
    
    // ✅ ENHANCED: Improved hasTopicAccess method
    hasTopicAccess(topic) {
      const topicType = this.getTopicType(topic);
      const currentStatus = this.currentUserStatus;
      
      console.log('🔐 Checking topic access:', {
        topicName: this.getTopicName(topic),
        topicType,
        currentStatus,
        hasAccess: this.checkTopicAccess(topicType, currentStatus)
      });
      
      if (topicType === 'free') return true;
      
      if (topicType === 'premium' && (currentStatus === 'start' || currentStatus === 'pro')) {
        return true;
      }
      
      if (topicType === 'pro' && currentStatus === 'pro') {
        return true;
      }
      
      return false;
    },

    // ✅ NEW: Helper method for topic access checking
    checkTopicAccess(topicType, userStatus) {
      if (topicType === 'free') return true;
      if (topicType === 'premium' && (userStatus === 'start' || userStatus === 'pro')) return true;
      if (topicType === 'pro' && userStatus === 'pro') return true;
      return false;
    },

    // Continue with all the remaining methods from the original file...
    // [The rest of the methods would continue here with all the data processing, UI helpers, etc.]
    // Due to length constraints, I'll provide the key remaining methods:

    // ============================================================================
    // 🎨 UI HELPER METHODS
    // ============================================================================
    
    getTopicName(topic) {
      if (!topic) {
        console.warn('⚠️ getTopicName: No topic provided');
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
      return this.studyList.some(t => t._id === topic._id);
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

    // ============================================================================
    // 🎯 TOPIC MANAGEMENT METHODS  
    // ============================================================================
    
    async handleAddTopic(topic) {
      if (!topic?._id || this.loadingOperations.add.has(topic._id)) {
        return;
      }
      
      this.loadingOperations.add.add(topic._id);
      
      try {
        console.log('➕ Adding topic to study list:', this.getTopicName(topic));
        
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
        
        console.log('📦 Sending study list data:', studyListData);
        
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
          console.log(`✅ Topic "${this.getTopicName(topic)}" added successfully`);
          
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
        console.log('🚀 Starting topic:', this.getTopicName(topic));
        
        const hasAccess = this.hasTopicAccess(topic);
        
        if (!hasAccess) {
          console.log('🔒 Topic requires subscription, showing paywall');
          this.requestedTopicId = topic._id;
          this.showPaywall = true;
          return;
        }
        
        const startingLesson = this.findStartingLesson(topic);
        
        if (startingLesson) {
          console.log(`📖 Navigating to lesson: ${startingLesson._id}`);
          this.$router.push({ 
            name: 'LessonPage', 
            params: { id: startingLesson._id },
            query: { source: 'main-page' }
          });
        } else if (topic._id) {
          console.log(`📚 Navigating to topic overview: ${topic._id}`);
          this.$router.push({ 
            path: `/topic/${topic._id}/overview`,
            query: { source: 'main-page' }
          });
        } else {
          throw new Error('No valid navigation target found');
        }
        
        this.performanceMetrics.successfulOperations++;
        
      } catch (error) {
        console.error('❌ Start topic error:', error);
        this.performanceMetrics.failedOperations++;
        this.showNotification('Не удалось открыть курс', 'error');
      } finally {
        this.loadingOperations.start.delete(topic._id);
      }
    },

    // ============================================================================
    // 💳 PAYMENT & MODAL METHODS
    // ============================================================================
    
    closePaywall() {
      this.showPaywall = false;
      this.requestedTopicId = null;
      console.log('💳 Paywall closed');
    },
    
    handlePaymentSuccess(newStatus) {
      console.log('💳 Payment successful, new status:', newStatus);
      
      this.handleUserStatusChange(newStatus, this.currentUserStatus);
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
            console.log('🚀 Auto-starting requested topic after payment');
            this.handleStartTopic(topic);
          }
        }, 1000);
      }
    },

    // ============================================================================
    // 🔔 NOTIFICATION SYSTEM
    // ============================================================================
    
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
      
      console.log(`🔔 Notification [${type}]: ${message}`);
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

    // ============================================================================
    // 🧹 CLEANUP METHODS
    // ============================================================================
    
    performCleanup() {
      console.log('🧹 MainPage: Performing cleanup...');
      
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }
      
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
      
              this.eventCleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('⚠️ Event cleanup error:', error);
        }
      });
      this.eventCleanupFunctions = [];
      
      this.loadingOperations.add.clear();
      this.loadingOperations.start.clear();
      this.loadingOperations.remove.clear();
      this.loadingOperations.refresh.clear();
      
      this.dismissAllNotifications();
      
      if (this.config.enableAnalytics) {
        console.log('📊 Final performance metrics:', this.performanceMetrics);
      }
      
      console.log('✅ MainPage cleanup completed');
    },

    dismissAllNotifications() {
      this.notifications = [];
    },

    // ============================================================================
    // 🛠️ UTILITY METHODS  
    // ============================================================================
    
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

    // ============================================================================
    // 🎛️ FILTER & SEARCH METHODS
    // ============================================================================
    
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

    // ============================================================================
    // 🎠 CAROUSEL METHODS
    // ============================================================================
    
    getRandomRecommendations(count = 10) {
      if (this.allRecommendations.length <= count) {
        return [...this.allRecommendations];
      }
      
      const shuffled = [...this.allRecommendations];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled.slice(0, count);
    },
    
    shuffleRecommendations() {
      if (this.allRecommendations.length === 0) {
        this.fetchRecommendations();
        return;
      }
      
      console.log('🎲 Shuffling recommendations...');
      
      this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
      
      this.$nextTick(() => {
        if (this.$refs.carouselContainer) {
          this.$refs.carouselContainer.scrollLeft = 0;
          this.updateScrollPosition();
        }
      });
      
      console.log(`🎲 Shuffled to ${this.displayedRecommendations.length} new recommendations`);
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
        
        console.log(`🔄 Refilled ${additional.length} recommendations`);
      }
    },

    // ============================================================================
    // 🔄 REFRESH METHODS
    // ============================================================================
    
    async refreshRecommendations() {
      if (this.loadingOperations.refresh.has('recommendations')) return;
      
      this.loadingOperations.refresh.add('recommendations');
      
      try {
        await this.fetchRecommendations();
        this.showNotification('Рекомендации обновлены', 'success');
        console.log('✅ Recommendations refreshed manually');
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
        console.log('✅ Study list refreshed manually');
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
        console.log('🔄 Refreshing all data...');
        
        await Promise.allSettled([
          this.fetchRecommendations(),
          this.fetchStudyList()
        ]);
        
        this.showNotification('Все данные обновлены', 'success');
        console.log('✅ All data refreshed');
        
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
      console.log(`🔄 Retry attempt ${this.retryCount}/${this.maxRetries}`);
      
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

    // ============================================================================
    // 🏗️ DATA PROCESSING METHODS (Additional methods needed)
    // ============================================================================
    
    buildTopicsFromLessons(lessons) {
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
      
      console.log(`🏗️ Built ${processedCount} unique topics from ${lessons.length} lessons`);
      
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
      console.log(`🔍 Enriching ${topics.length} topics with lessons...`);
      
      const enrichmentPromises = topics.map(async (topic) => {
        try {
          const lessonsResult = await getLessonsByTopic(topic._id);
          this.performanceMetrics.totalApiCalls++;
          
          if (lessonsResult?.success && lessonsResult.data?.length > 0) {
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
          console.warn(`⚠️ Failed to enrich topic ${topic._id}:`, error.message);
          return null;
        }
      });
      
      const results = await Promise.allSettled(enrichmentPromises);
      
      const enrichedTopics = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      console.log(`✅ Successfully enriched ${enrichedTopics.length}/${topics.length} topics`);
      
      return enrichedTopics;
    },

    async processStudyListEntry(entry, userProgressData) {
      if (!entry?.topicId) return null;

      try {
        console.log(`🔍 Processing study list entry: ${entry.topicId}`);
        
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
            console.log(`📊 Got fresh data for topic ${entry.topicId}`);
            
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
          console.warn(`⚠️ Failed to get fresh topic data for ${entry.topicId}:`, topicError.message);
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
              console.log(`📚 Got ${lessons.length} lessons for topic ${entry.topicId}`);
            }
          } catch (lessonsError) {
            console.warn(`⚠️ Failed to get lessons for topic ${entry.topicId}:`, lessonsError.message);
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
      if (!lessons || lessons.length === 0) {
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
        
        console.log(`📊 Extracted ${this.allSubjects.length} subjects and ${this.allLevels.length} levels`);
        
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
        console.log('🗑️ Removing study card:', topicId);
        
        const topicToRemove = this.studyList.find(t => t._id === topicId);
        
        this.studyList = this.studyList.filter(topic => topic._id !== topicId);
        
        this.forceReactivityUpdate();
        
        try {
          const result = await removeFromStudyList(this.userId, topicId);
          this.performanceMetrics.totalApiCalls++;
          
          if (result?.success) {
            console.log('✅ Successfully removed from backend');
            this.performanceMetrics.successfulOperations++;
          } else {
            console.warn('⚠️ Backend removal failed but UI updated');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend removal failed:', backendError.message);
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