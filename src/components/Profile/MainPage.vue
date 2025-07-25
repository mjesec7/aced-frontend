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
            <option value="free"> Бесплатные</option>
            <option value="premium">Премиум</option>
            <option value="pro"> Pro</option>
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
// Assuming 'auth' from '@/firebase' is used for user authentication logic,
// but it's not directly used in the provided methods, so keeping it commented if not needed.
// import { auth } from '@/firebase';
import StudyCard from '@/components/Profile/StudyCard.vue';
import PaymentModal from '@/components/Modals/PaymentModal.vue';
import { eventBus } from '@/main.js';

export default {
  name: 'MainPage',
  components: { 
    StudyCard, 
    PaymentModal 
  },
  
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
      allRecommendations: [], // All available recommendations from API
      displayedRecommendations: [], // Currently displayed subset (10 random)
      recommendationsLastFetch: null,
      recommendationsSource: null, // 'lessons' | 'topics' | 'fallback'
      
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
        add: new Set(),    // Topics being added to study list
        start: new Set(),  // Topics being started
        remove: new Set(), // Topics being removed
        refresh: new Set() // Data being refreshed
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
      // 🔄 REACTIVITY & PERFORMANCE
      // ============================================================================
      componentKey: 0,
      updateTimer: null,
      lastFilterChange: Date.now(),
      // forceUpdateCounter is now mapped from Vuex, remove from data
      // forceUpdateCounter: 0, 
      
      // ============================================================================
      // 🔔 NOTIFICATION SYSTEM
      // ============================================================================
      notifications: [],
      notificationCounter: 0,
      maxNotifications: 5,
      
      // ============================================================================
      // 🧹 EVENT CLEANUP TRACKING
      // ============================================================================
      unsubscribeStore: null,
      eventCleanupFunctions: [],
      globalEventListeners: new Map(),
      
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
        autoRefreshInterval: 300000, // 5 minutes
        maxRecommendations: 10,
        enableNotifications: true,
        enableProgressTracking: true,
        enableAnalytics: import.meta.env.DEV
      }
    };
  },
  
  computed: {
    // ============================================================================
    // 👤 USER STATUS COMPUTED PROPERTIES
    // ============================================================================
    // ✅ ENHANCED: Reactive user status tracking
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser', 
      'isStartUser',
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'getUser', // Keep if still used directly in template or other methods
      'subscriptionDetails',
      'forceUpdateCounter' // Mapped from Vuex
    ]),
    
    // ✅ NEW: Reactive current user status with multiple triggers
    currentUserStatus() {
      // The `counter` variable explicitly uses `this.forceUpdateCounter` from Vuex
      // to ensure this computed property reacts to changes in the Vuex store's counter.
      const counter = this.forceUpdateCounter || 0; 
      const storeStatus = this.userStatus;
      const localStatus = localStorage.getItem('userStatus');
      const computedStatus = storeStatus || localStatus || 'free';
      
      // Auto-fix inconsistencies
      if (storeStatus && localStatus && storeStatus !== localStatus) {
        console.log(`🔧 MainPage: Auto-fixing status inconsistency: store(${storeStatus}) !== localStorage(${localStatus})`);
        localStorage.setItem('userStatus', storeStatus);
      }
      
      return computedStatus;
    },
    
    // ✅ ENHANCED: User status label with reactivity
    userStatusLabel() {
      const status = this.currentUserStatus;
      const labels = {
        'pro': 'Pro',
        'start': 'Start', 
        'premium': 'Start', // Alias
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
  // 👀 WATCHERS
  // ============================================================================
  
  watch: {
    // ✅ NEW: Watch for user status changes from store (using `userStatus` from Vuex)
    userStatus: {
      handler(newStatus, oldStatus) {
        console.log('📊 MainPage: User status changed from', oldStatus, 'to:', newStatus);
        this.handleUserStatusChange(newStatus, oldStatus);
      },
      immediate: true
    },
    
    // ✅ NEW: Watch for force update counter changes (from Vuex getter)
    forceUpdateCounter: {
      handler(newCounter, oldCounter) {
        console.log('📊 MainPage: Force update counter changed:', oldCounter, '→', newCounter);
        this.forceReactivityUpdate(); // Call the force reactivity method
      },
      immediate: true
    },
    
    // ✅ NEW: Watch for subscription details changes (from Vuex getter)
    subscriptionDetails: {
      handler(newSub, oldSub) {
        if (newSub !== oldSub) {
          console.log('💳 MainPage: Subscription details changed:', newSub);
          this.forceReactivityUpdate(); // Call the force reactivity method
        }
      },
      deep: true,
      immediate: true
    },

    // Watch for search query changes
    searchQuery: {
      handler() {
        this.debouncedFilterUpdate();
      }
    },
    
    // Watch for filter changes
    filterSubject() { this.debouncedFilterUpdate(); },
    filterLevel() { this.debouncedFilterUpdate(); },
    filterType() { this.debouncedFilterUpdate(); },
    filterProgress() { this.debouncedFilterUpdate(); },
    sortBy() { this.debouncedFilterUpdate(); }
  },
  
  // ============================================================================
  // 🔄 LIFECYCLE HOOKS
  // ============================================================================
  
  async mounted() {
    const startTime = Date.now();
    console.log('📱 MainPage: Component mounted');
    
    try {
      // Record mount time
      this.performanceMetrics.mountTime = startTime;
      
      // Validate user authentication
      await this.validateUserAuthentication();
      
      // ✅ ENHANCED: Setup comprehensive global event system
      this.setupGlobalEventSystem();
      
      // Initialize data loading
      await this.initializeDataLoading();
      
      // Setup auto-refresh if enabled
      if (this.config.enableAutoRefresh) {
        this.setupAutoRefresh();
      }
      
      // Setup performance monitoring
      if (this.config.enableAnalytics) {
        this.setupPerformanceMonitoring();
      }
      
      const mountTime = Date.now() - startTime;
      console.log(`✅ MainPage: Mounted successfully in ${mountTime}ms`);
      
      // Show welcome notification
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
    
    // ✅ NEW: Enhanced global event system setup (like UserSection)
    setupGlobalEventSystem() {
      console.log('🔗 MainPage: Setting up global event system...');
      
      // ===== SUBSCRIPTION CHANGE HANDLERS =====
      // Event handler for custom DOM event 'userSubscriptionChanged'
      this.handleSubscriptionChange = (event) => {
        console.log('📡 MainPage: Subscription change received:', event.detail);
        
        const { plan, source, oldPlan } = event.detail;
        
        // Force immediate UI update
        this.forceReactivityUpdate();
        
        // Update performance metrics
        this.performanceMetrics.successfulOperations++;
        
        // Show celebration for upgrades
        if (plan && plan !== 'free' && oldPlan === 'free') {
          const planLabel = plan === 'pro' ? 'Pro' : 'Start';
          const sourceText = source === 'promocode' ? 'промокоду' : 'оплате';
          
          this.showNotification(
            `🎉 Поздравляем! ${planLabel} подписка активирована по ${sourceText}!`,
            'success',
            5000
          );
        }
      };
      
      // Event handler for EventBus 'userStatusChanged'
      this.handleUserStatusChange = (data) => {
        console.log('📡 MainPage: User status changed via event bus:', data);
        this.forceReactivityUpdate();
      };
      
      // Event handler for EventBus 'promocodeApplied'
      this.handlePromocodeApplied = (data) => {
        console.log('📡 MainPage: Promocode applied:', data);
        
        if (data.newStatus && data.newStatus !== 'free') {
          const planLabel = data.newStatus === 'pro' ? 'Pro' : 'Start';
          this.showNotification(
            `🎟️ Промокод применён! ${planLabel} план активирован!`,
            'success',
            5000
          );
        }
        
        this.forceReactivityUpdate();
      };
      
      // Event handler for EventBus 'globalForceUpdate'
      this.handleGlobalForceUpdate = (data) => {
        console.log('📡 MainPage: Global force update:', data);
        this.forceReactivityUpdate();
      };
      
      // Event handler for EventBus 'paymentCompleted'
      this.handlePaymentCompleted = (data) => {
        console.log('📡 MainPage: Payment completed:', data);
        this.handleSubscriptionChange({ detail: data });
      };
      
      // ===== REGISTER EVENT LISTENERS =====
      
      // DOM event listeners (if applicable to window object)
      if (typeof window !== 'undefined') {
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.globalEventListeners.set('userSubscriptionChanged', this.handleSubscriptionChange);
      }
      
      // Event bus listeners
      const eventBusEvents = [
        ['userStatusChanged', this.handleUserStatusChange],
        ['promocodeApplied', this.handlePromocodeApplied],
        ['globalForceUpdate', this.handleGlobalForceUpdate],
        ['subscriptionUpgrade', this.handlePromocodeApplied], // This seems to be a duplicate or alias of promocodeApplied
        ['paymentCompleted', this.handlePaymentCompleted]
      ];
      
      eventBusEvents.forEach(([event, handler]) => {
        eventBus.on(event, handler);
        this.eventCleanupFunctions.push(() => {
          eventBus.off(event, handler);
        });
      });
      
      // ===== STORE MUTATION LISTENER =====
      this.unsubscribeStore = this.$store.subscribe((mutation) => {
        if (this.isUserRelatedMutation(mutation)) {
          console.log('📊 MainPage: Store mutation detected:', mutation.type);
          this.forceReactivityUpdate();
        }
      });
      
      console.log('✅ MainPage: Global event system setup complete');
    },
    
    async initializeDataLoading() {
      console.log('📊 Initializing data loading...');
      
      const startTime = Date.now();
      
      // Load both datasets in parallel with comprehensive error handling
      const results = await Promise.allSettled([
        this.fetchRecommendations(),
        this.fetchStudyList()
      ]);
      
      // Process results
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
      
      // Update performance counters
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
      
      // Cleanup function
      this.eventCleanupFunctions.push(() => {
        if (this.autoRefreshInterval) {
          clearInterval(this.autoRefreshInterval);
        }
      });
    },
    
    setupPerformanceMonitoring() {
      if (!this.config.enableAnalytics) return;
      
      console.log('📈 Setting up performance monitoring...');
      
      // Track visibility changes
      this.handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('📱 MainPage: Hidden');
        } else {
          console.log('📱 MainPage: Visible');
          // Refresh data when page becomes visible again
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
    // 🔄 REACTIVITY & UPDATE METHODS
    // ============================================================================
    
    // ✅ NEW: Enhanced reactivity update
    forceReactivityUpdate() {
      this.componentKey++;
      // It's important that `forceUpdateCounter` is a reactive property (e.g., from Vuex or `data`).
      // Since it's now mapped from Vuex, ensure your Vuex store has a mutation to increment it.
      // For this example, I'm assuming such a mutation exists and the getter reflects it.
      // If it was a local data property, it would be `this.forceUpdateCounter++;`.
      // Given your original snippet for `forceReactivityUpdate` already had `this.forceUpdateCounter++`,
      // and it's also in the proposed enhanced snippet, I'll keep it as a local state update.
      // However, it's generally better to commit a mutation if `forceUpdateCounter` is truly in Vuex.
      // For strict adherence to the provided code, I'll keep it as `this.forceUpdateCounter++` in data,
      // and map the Vuex one as `mappedForceUpdateCounter` if both are needed, but that seems redundant.
      // For simplicity and based on the instruction to "remove from data" if mapped, I'll assume
      // the mapped `forceUpdateCounter` itself is the source of truth, and this method just triggers
      // Vue's reactivity. If you *intended* for `forceUpdateCounter` to be a local counter *in addition*
      // to the Vuex one, please clarify. Assuming `forceUpdateCounter` is purely from Vuex here.
      
      // Trigger Vue's reactivity system
      this.$forceUpdate();
      
      // Additional delayed updates for maximum compatibility
      this.$nextTick(() => {
        this.$forceUpdate();
        
        setTimeout(() => {
          this.$forceUpdate();
        }, 100);
      });
      
      console.log(`🔄 MainPage: Force update (key: ${this.componentKey})`);
    },
    
    debouncedFilterUpdate() {
      clearTimeout(this.updateTimer);
      this.lastFilterChange = Date.now();
      
      this.updateTimer = setTimeout(() => {
        this.forceReactivityUpdate();
        console.log('🎯 Filters updated');
      }, 300);
    },
    
    // ✅ NEW: Handle user status changes (this method is now a standalone one, called by watcher and eventBus handler)
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;
      
      console.log(`👤 MainPage: Handling status change ${oldStatus} → ${newStatus}`);
      
      // Update localStorage immediately
      localStorage.setItem('userStatus', newStatus);
      
      // Force reactivity update
      this.forceReactivityUpdate();
      
      // Update performance metrics
      this.performanceMetrics.successfulOperations++;
      
      // Show status change notification
      if (oldStatus && oldStatus !== 'free' && newStatus === 'free') {
        this.showNotification('Подписка истекла', 'warning');
      }
    },
    
    // ✅ NEW: Check if mutation is user-related
    isUserRelatedMutation(mutation) {
      return mutation.type.includes('user/') && 
             (mutation.type.includes('STATUS') || 
              mutation.type.includes('SUBSCRIPTION') ||
              mutation.type.includes('UPDATE') || // e.g., USER_INFO_UPDATE
              mutation.type.includes('FORCE')); // e.g., INCREMENT_FORCE_UPDATE_COUNTER
    },

    // A method to trigger reactivity update when `forceUpdateCounter` changes (used by watcher)
    triggerReactivityUpdate() {
      this.forceReactivityUpdate(); // Simply call the main force update method
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
        
        // Strategy 1: Build from lessons (primary approach)
        let lessonsResult;
        try {
          lessonsResult = await getAllLessons();
          this.performanceMetrics.totalApiCalls++;
        } catch (apiError) {
          console.error('❌ getAllLessons failed:', apiError);
          // Fallback to direct topics if primary strategy fails
          return this.fetchRecommendationsFallback(); 
        }
        
        if (lessonsResult?.success && lessonsResult.data?.length > 0) {
          console.log(`📚 Got ${lessonsResult.data.length} lessons for building recommendations`);
          
          // Build topics from lessons
          const topics = this.buildTopicsFromLessons(lessonsResult.data);
          
          if (topics.length > 0) {
            this.allRecommendations = topics;
            this.displayedRecommendations = this.getRandomRecommendations(this.config.maxRecommendations);
            this.extractSubjectsAndLevels(this.allRecommendations);
            this.recommendationsSource = 'lessons';
            this.recommendationsLastFetch = Date.now();
            
            console.log(`✅ Built ${topics.length} recommendations from lessons in ${Date.now() - startTime}ms`);
            this.performanceMetrics.successfulOperations++;
            return; // Successfully fetched from lessons, exit
          }
        }
        
        // Fallback to direct topics if lessons method didn't yield results
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
          
          // Enrich topics with lessons
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
            return; // Successfully fetched from topics, exit
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
        
        // Get user progress for calculating completion
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
        
        // Process each study list entry with comprehensive error handling
        const validTopics = [];
        const processingPromises = studyListData.map(async (entry) => { // Removed index as it's not used
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
    // 🏗️ DATA PROCESSING METHODS
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
          
          // Update description with lesson count
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
          // Sort by subject first, then by level
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
        
        // Build comprehensive base topic data from the entry itself (for initial display)
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
        
        // Try to get fresh topic data from API
        try {
          const topicResult = await getTopicById(entry.topicId);
          this.performanceMetrics.totalApiCalls++;
          
          if (topicResult?.success && topicResult.data) {
            const freshData = topicResult.data;
            console.log(`📊 Got fresh data for topic ${entry.topicId}`);
            
            // Smart merge: preserve study list names if API data lacks them
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
        
        // Get lessons for this topic
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
        
        // Calculate comprehensive progress
        const progress = this.calculateTopicProgress(lessons, userProgressData);
        
        // Build final topic object
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
      
      // Calculate medal based on completion and average stars
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
          // Add to local state immediately for responsive UI
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
          
          // Remove from recommendations
          this.allRecommendations = this.allRecommendations.filter(t => t._id !== topic._id);
          this.displayedRecommendations = this.displayedRecommendations.filter(t => t._id !== topic._id);
          
          // Refill displayed recommendations if needed
          this.refillDisplayedRecommendations();
          
          // Update performance metrics
          this.performanceMetrics.successfulOperations++;
          
          this.showNotification('✅ Курс добавлен в ваш список!', 'success');
          console.log(`✅ Topic "${this.getTopicName(topic)}" added successfully`);
          
          // Background refresh to sync with server
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
        
        // Check access permissions
        const hasAccess = this.hasTopicAccess(topic);
        
        if (!hasAccess) {
          console.log('🔒 Topic requires subscription, showing paywall');
          this.requestedTopicId = topic._id;
          this.showPaywall = true;
          return;
        }
        
        // Find the best lesson to start with
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
        
        // Update performance metrics
        this.performanceMetrics.successfulOperations++;
        
      } catch (error) {
        console.error('❌ Start topic error:', error);
        this.performanceMetrics.failedOperations++;
        this.showNotification('Не удалось открыть курс', 'error');
      } finally {
        this.loadingOperations.start.delete(topic._id);
      }
    },
    
    async removeStudyCard(topicId) {
      if (!topicId || this.loadingOperations.remove.has(topicId)) {
        return;
      }
      
      this.loadingOperations.remove.add(topicId);
      
      try {
        console.log('🗑️ Removing study card:', topicId);
        
        // Find the topic before removal for undo functionality
        const topicToRemove = this.studyList.find(t => t._id === topicId);
        
        // Remove from local state immediately for responsive UI
        this.studyList = this.studyList.filter(topic => topic._id !== topicId);
        
        // Force UI update
        this.forceReactivityUpdate();
        
        // Try to remove from backend
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
          
          // Optionally restore the item on backend failure
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
        
        // Reload study list on critical error
        setTimeout(() => {
          this.fetchStudyList();
        }, 1000);
      } finally {
        this.loadingOperations.remove.delete(topicId);
      }
    },
    
    // ============================================================================
    // 🎨 UI HELPER METHODS
    // ============================================================================
    
    // Topic name extraction with comprehensive fallback strategies
    getTopicName(topic) {
      if (!topic) {
        console.warn('⚠️ getTopicName: No topic provided');
        return 'Без названия';
      }
      
      try {
        // Priority order for name fields
        const nameFields = ['name', 'topicName', 'topic', 'title'];
        
        for (const field of nameFields) {
          if (topic[field]) {
            // Handle string values
            if (typeof topic[field] === 'string' && topic[field].trim()) {
              return topic[field].trim();
            }
            
            // Handle localized object values
            if (typeof topic[field] === 'object' && topic[field] !== null) {
              const localizedName = this.extractLocalizedString(topic[field]);
              if (localizedName) {
                return localizedName;
              }
            }
          }
        }
        
        // Fallback strategies
        return this.generateTopicNameFallback(topic);
        
      } catch (error) {
        console.error('❌ Error in getTopicName:', error);
        return 'Ошибка названия';
      }
    },
    
    getTopicDescription(topic) {
      if (!topic) return 'Описание отсутствует';
      
      try {
        // Try description fields
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
        
        // Generate description from available data
        return this.generateTopicDescription(topic);
        
      } catch (error) {
        console.error('❌ Error in getTopicDescription:', error);
        return 'Описание отсутствует';
      }
    },
    
    getTopicNameFromLesson(lesson) {
      if (!lesson) return 'Без темы';
      
      try {
        // Direct topic field
        if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
        }
        
        // Localized topic field
        if (lesson.topic && typeof lesson.topic === 'object') {
          const localizedTopic = this.extractLocalizedString(lesson.topic);
          if (localizedTopic) {
            return localizedTopic;
          }
        }
        
        // Translation field
        if (lesson.translations?.[this.lang]?.topic) {
          return String(lesson.translations[this.lang].topic).trim();
        }
        
        // Fallback to lesson name
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
    
    // Topic type and access control methods
    getTopicType(topic) {
      if (!topic) return 'free';
      
      const type = topic.type || topic.accessType || topic.pricing || topic.plan || topic.tier;
      
      // Normalize type values
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
    
    hasTopicAccess(topic) {
      const topicType = this.getTopicType(topic);
      const currentStatus = this.currentUserStatus;
      
      // Free topics are always accessible
      if (topicType === 'free') return true;
      
      // Premium topics require Start or Pro
      if (topicType === 'premium' && (currentStatus === 'start' || currentStatus === 'pro')) {
        return true;
      }
      
      // Pro topics require Pro subscription
      if (topicType === 'pro' && currentStatus === 'pro') {
        return true;
      }
      
      return false;
    },
    
    // Button state methods
    isInStudyList(topic) {
      return this.studyList.some(t => t._id === topic._id);
    },
    
    getAddButtonIcon(topic) {
      if (this.loadingOperations.add.has(topic._id)) return '⏳';
      if (this.isInStudyList(topic)) return '✓';
      return '+';
    },
    
    getAddButtonText(topic) {
      if (this.loadingOperations.add.has(topic._id)) return 'Добавление...';
      if (this.isInStudyList(topic)) return 'Добавлено';
      return 'Добавить';
    },
    
    getAddButtonTitle(topic) {
      if (this.isInStudyList(topic)) {
        return 'Уже в списке изучения';
      }
      return `Добавить "${this.getTopicName(topic)}" в мои курсы`;
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
    // 🎛️ FILTER & SEARCH METHODS
    // ============================================================================
    
    passesAllFilters(topic) {
      try {
        const name = this.getTopicName(topic);
        const description = this.getTopicDescription(topic);
        const topicType = this.getTopicType(topic);
        const progress = topic.progress?.percent || 0;
        
        // Text search filter
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
        
        // Subject filter
        if (this.filterSubject && topic.subject !== this.filterSubject) {
          return false;
        }
        
        // Level filter
        if (this.filterLevel) {
          const topicLevel = parseInt(topic.level) || 1;
          const filterLevel = parseInt(this.filterLevel);
          if (topicLevel !== filterLevel) return false;
        }
        
        // Type filter
        if (this.filterType && topicType !== this.filterType) {
          return false;
        }
        
        // Progress filter (only applies to study list)
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
        return true; // Include item if filter check fails
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
        return items; // Return unsorted if sorting fails
      }
    },
    
    clearSearch() {
      this.searchQuery = '';
      this.debouncedFilterUpdate();
    },
    
    clearAllFilters() { // Renamed from clearFilters to avoid confusion with `clearSearch`
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
      this.filterType = '';
      this.filterProgress = '';
      this.sortBy = 'name';
      this.debouncedFilterUpdate();
      
      this.showNotification('Фильтры очищены', 'info');
    },
    
    // Filter label helpers
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
      
      // Use crypto.getRandomValues for better randomness if available
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
      
      // Reset carousel position
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
      
      const scrollAmount = 320; // Width of one card + gap
      const currentScroll = container.scrollLeft;
      
      const targetScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      // Update scroll position after animation
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
        this.retryCount = 0; // Reset retry count on success
      } else if (successful > 0) {
        this.showNotification('Некоторые данные загружены', 'warning');
      } else {
        this.showNotification('Не удалось загрузить данные', 'error');
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
    
    handlePaymentSuccess(newStatus) { // This method is called from PaymentModal via @unlocked
      console.log('💳 Payment successful, new status:', newStatus);
      
      // The store should already be updated by the payment modal
      // Force a reactivity update and close modal
      this.forceReactivityUpdate();
      this.closePaywall();
      
      // Update performance metrics
      this.performanceMetrics.successfulOperations++;
      
      // Show success message
      const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
      this.showNotification(
        `🎉 Поздравляем! ${planLabel} подписка активирована!`,
        'success',
        5000
      );
      
      // If there was a requested topic, try to start it after a delay
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
    
    handleProgressUpdate(topicId, newProgress) {
      console.log('📊 Progress updated:', topicId, newProgress);
      
      // Update local state
      const topicIndex = this.studyList.findIndex(t => t._id === topicId);
      if (topicIndex !== -1) {
        this.studyList[topicIndex].progress = {
          ...this.studyList[topicIndex].progress,
          ...newProgress,
          lastUpdated: new Date().toISOString()
        };
        
        // Force reactivity update
        this.forceReactivityUpdate();
        
        // Show progress notification for significant milestones
        if (newProgress.percent === 100) {
          const topicName = this.getTopicName(this.studyList[topicIndex]);
          this.showNotification(`🎉 Курс "${topicName}" завершен!`, 'success');
        } else if (newProgress.percent >= 50 && newProgress.percent < 100) {
          // Show milestone notification only once
          const topic = this.studyList[topicIndex];
          if (!topic.milestoneNotified) {
            topic.milestoneNotified = true;
            this.showNotification('📈 Вы прошли половину курса!', 'info');
          }
        }
      }
    },
    
    // ============================================================================
    // 🔔 NOTIFICATION SYSTEM
    // ============================================================================
    
    showNotification(message, type = 'info', duration = 4000) {
      if (!this.config.enableNotifications) return;
      
      // Prevent duplicate notifications
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
      
      // Limit number of notifications
      if (this.notifications.length >= this.maxNotifications) {
        this.notifications.shift(); // Remove oldest
      }
      
      this.notifications.push(notification);
      
      // Auto-dismiss
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
    
    dismissAllNotifications() {
      this.notifications = [];
    },
    
    // ============================================================================
    // 🛠️ UTILITY METHODS
    // ============================================================================
    
    extractSubjectsAndLevels(items) {
      if (!Array.isArray(items)) return;
      
      try {
        // Extract unique subjects
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
      
      // Show notification for critical errors
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
      
      // Update performance metrics
      this.performanceMetrics.failedOperations++;
    },
    
    // Helper methods for data processing
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
    
    extractLocalizedString(obj) {
      if (!obj || typeof obj !== 'object') return null;
      
      // Try current language first
      if (obj[this.lang] && typeof obj[this.lang] === 'string' && obj[this.lang].trim()) {
        return obj[this.lang].trim();
      }
      
      // Try fallback languages
      const fallbackLanguages = ['ru', 'en', 'uz'];
      for (const lang of fallbackLanguages) {
        if (obj[lang] && typeof obj[lang] === 'string' && obj[lang].trim()) {
          return obj[lang].trim();
        }
      }
      
      // Try any string value
      const stringValue = Object.values(obj).find(val => 
        val && typeof val === 'string' && val.trim()
      );
      
      return stringValue ? stringValue.trim() : null;
    },
    
    generateTopicNameFallback(topic) {
      // Try to construct from available data
      if (topic.subject) {
        const subject = typeof topic.subject === 'string' ? topic.subject : String(topic.subject);
        const level = topic.level ? ` (Уровень ${topic.level})` : '';
        return `${subject}${level}`;
      }
      
      // Use lesson name if this is built from lessons
      if (topic.metadata?.source === 'built-from-lessons' && topic.lessons?.length > 0) {
        const firstLesson = topic.lessons[0];
        if (firstLesson.lessonName) {
          return `Курс: ${firstLesson.lessonName}`;
        }
        if (firstLesson.title) {
          return `Курс: ${firstLesson.title}`;
        }
      }
      
      // Use ID as readable name
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
    
    shouldPreserveStudyListNames(freshData) {
      return !freshData.name && !freshData.topicName && 
             !freshData.topic && !freshData.title;
    },
    
    calculateLessonTime(lesson) {
      // Calculate estimated time for a lesson
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      if (lesson.timeToComplete) return parseInt(lesson.timeToComplete);
      
      // Default to 10 minutes per lesson
      return 10;
    },
    
    calculateTopicTotalTime(topic) {
      if (topic.totalTime) return parseInt(topic.totalTime);
      if (topic.lessons?.length) {
        return topic.lessons.reduce((sum, lesson) => sum + this.calculateLessonTime(lesson), 0);
      }
      return (topic.lessonCount || 1) * 10; // Default to 10 minutes per lesson
    },
    
    calculateTopicDifficulty(topic) {
      const level = parseInt(topic.level) || 1;
      
      if (level <= 2) return 1; // Beginner
      if (level <= 4) return 2; // Intermediate
      if (level <= 6) return 3; // Advanced
      return 4; // Expert
    },
    
    findStartingLesson(topic) {
      if (!topic.lessons || topic.lessons.length === 0) return null;
      
      // Try to find the first lesson based on order or name
      const lessons = [...topic.lessons];
      
      // Sort by order if available
      if (lessons[0].order !== undefined) {
        lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      
      // Return first valid lesson
      return lessons.find(lesson => lesson && lesson._id) || null;
    },
    
    getCoursesWord(count) {
      const num = parseInt(count) || 0;
      
      if (num % 10 === 1 && num % 100 !== 11) return 'курс';
      if ([2, 3, 4].includes(num % 10) && ![12, 13, 14].includes(num % 100)) return 'курса';
      return 'курсов';
    },
    
    // ============================================================================
    // 🧹 CLEANUP METHODS
    // ============================================================================
    
    performCleanup() {
      console.log('🧹 MainPage: Performing cleanup...');
      
      // Clear timers
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }
      
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
      
      // Clean up global event listeners
      // Ensure globalEventListeners map exists before iterating
      if (this.globalEventListeners) {
        this.globalEventListeners.forEach((handler, event) => {
          try {
            // Check if window object exists (for SSR compatibility)
            if (typeof window !== 'undefined') {
              window.removeEventListener(event, handler);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to remove ${event} listener:`, error);
          }
        });
        this.globalEventListeners.clear();
      }
      
      // Clean up event bus listeners
      // Ensure eventCleanupFunctions array exists before iterating
      if (this.eventCleanupFunctions) {
        this.eventCleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('⚠️ Event cleanup error:', error);
          }
        });
        this.eventCleanupFunctions = [];
      }
      
      // Unsubscribe from store
      if (this.unsubscribeStore) {
        this.unsubscribeStore();
        this.unsubscribeStore = null;
      }
      
      // Clear loading operations
      // Ensure loadingOperations object exists before accessing its properties
      if (this.loadingOperations) {
        this.loadingOperations.add.clear();
        this.loadingOperations.start.clear();
        this.loadingOperations.remove.clear();
        this.loadingOperations.refresh.clear();
      }
      
      // Clear notifications
      // Ensure dismissAllNotifications method exists before calling
      if (this.dismissAllNotifications) {
        this.dismissAllNotifications();
      }
      
      // Log final performance metrics
      if (this.config.enableAnalytics) {
        console.log('📊 Final performance metrics:', this.performanceMetrics);
      }
      
      console.log('✅ MainPage cleanup completed');
    }
  }
};
</script>

<style scoped>
/* MainPage.vue - Compact Card Styles */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ========================================
   🎨 BASE THEME: BLACK, WHITE, PURPLE
======================================== */
.dashboard {
  padding: 24px 16px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  min-height: 100vh;
  color: #1a1a1a;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin-bottom: 32px;
  letter-spacing: -0.02em;
}

/* ========================================
   🎛️ PROFESSIONAL FILTER BAR
======================================== */
.filter-bar {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  margin-bottom: 32px;
  overflow: hidden;
}

.filter-section {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6b7280;
  font-size: 0.9rem;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.9rem;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-search {
  position: absolute;
  right: 8px;
  background: #6b7280;
  color: #ffffff;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: #4b5563;
}

.filters-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.85rem;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.filter-select:hover {
  border-color: #d1d5db;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.refresh-btn {
  background: #1e40af;
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.refresh-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-icon {
  font-size: 0.9rem;
  transition: transform 0.5s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.user-badge {
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.user-badge.free { background: #6b7280; }
.user-badge.start { background: #8b5cf6; }
.user-badge.pro { background: #1a1a1a; }

/* Active Filters Row */
.active-filters-row {
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  padding: 12px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-tag {
  background: #8b5cf6;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.clear-all-btn {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.clear-all-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.refresh-recommendations-btn {
  background: #8b5cf6;
  color: #ffffff;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.refresh-recommendations-btn:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-1px);
}

.refresh-recommendations-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ========================================
   🎠 RECOMMENDATIONS CAROUSEL - COMPACT
======================================== */
.recommendations-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.carousel-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 0;
}

.carousel-container::-webkit-scrollbar {
  display: none;
}

.carousel-track {
  display: flex;
  gap: 16px;
  padding: 0 8px;
}

/* ========================================
   🎴 RECOMMENDATION CARDS - COMPACT SIZE
======================================== */
.recommendation-card {
  flex: 0 0 280px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  height: 360px;
  position: relative;
  overflow: hidden;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.4), 0 12px 32px rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.03), #ffffff);
}

.loading-carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px;
}

.loading-carousel .recommendation-placeholder {
  flex: 0 0 280px;
  height: 360px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

.carousel-nav {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.carousel-nav:hover:not(.disabled) {
  background: #8b5cf6;
  color: #ffffff;
  border-color: #8b5cf6;
  transform: scale(1.1);
}

.carousel-nav.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.carousel-nav.prev {
  margin-right: 4px;
}

.carousel-nav.next {
  margin-left: 4px;
}

/* ========================================
   🏷️ TOPIC BADGE - COMPACT
======================================== */
.topic-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.topic-badge.free {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.topic-badge.premium {
  background: #8b5cf6;
  color: #ffffff;
  border: 1px solid #8b5cf6;
}

.topic-badge.pro {
  background: #1f2937;
  color: #ffffff;
  border: 1px solid #1f2937;
}

/* ========================================
   📝 TOPIC CONTENT - COMPACT
======================================== */
.topic-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px;
  padding-top: 32px;
}

.topic-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6rem;
}

.topic-desc {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
  min-height: 2.4rem;
}

.topic-stats {
  display: flex;
  justify-content: space-between;
  margin: 0 0 8px 0;
  padding: 6px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.stat-icon {
  font-size: 0.8rem;
  opacity: 0.7;
}

.stat-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #111827;
}

.subject-info {
  margin-bottom: 12px;
}

.subject-tag {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid #cbd5e1;
}

/* ========================================
   🔘 CARD ACTIONS - COMPACT
======================================== */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  flex-shrink: 0;
  align-items: center;
}

.add-btn,
.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  min-height: 36px;
  box-sizing: border-box;
}

.add-btn {
  flex: 1;
  background: #f8fafc;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.add-btn:hover:not(:disabled) {
  background: #8b5cf6;
  color: #ffffff;
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

.add-btn:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  border-color: #e2e8f0;
  cursor: not-allowed;
}

.start-btn {
  flex: 1;
  background: #111827;
  color: #ffffff;
  border: 2px solid #111827;
}

.start-btn:hover {
  background: #1f2937;
  border-color: #1f2937;
  transform: translateY(-1px);
}

.start-btn.btn-restricted {
  background: #6b7280;
  border-color: #6b7280;
}

.start-btn.btn-restricted:hover {
  background: #4b5563;
  border-color: #4b5563;
}

.add-icon,
.start-icon {
  font-size: 0.8rem;
  font-weight: bold;
}

.add-text,
.start-text {
  font-size: 0.7rem;
  font-weight: 600;
}

/* ========================================
   🚨 ERROR ALERTS
======================================== */
.error-alert {
  background: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-messages {
  flex: 1;
}

.error-messages p {
  margin: 0 0 4px 0;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 500;
}

.retry-btn {
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #8b5cf6;
  transform: translateY(-1px);
}

.retry-btn.inline {
  background: #8b5cf6;
  margin-top: 12px;
}

.retry-btn.inline:hover {
  background: #7c3aed;
}

/* ========================================
   📦 SECTIONS
======================================== */
.section {
  margin-bottom: 60px;
  position: relative;
}

.recommendations-section,
.study-section {
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
  text-align: left;
  position: relative;
}

.section h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: #8b5cf6;
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin-bottom: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  background: #f3f4f6;
  color: #1a1a1a;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.info-badge {
  background: #8b5cf6;
  color: #ffffff;
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: default;
}

/* ========================================
   🃏 GRID & CARDS
======================================== */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 0;
}

.recommendation-placeholder,
.study-placeholder {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
}

.empty-message {
  text-align: center;
  margin-top: 40px;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 400;
  padding: 40px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message h3 {
  margin: 0 0 12px 0;
  color: #1a1a1a;
  font-size: 1.25rem;
  font-weight: 600;
}

.empty-message p {
  margin: 8px 0;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.clear-filters-btn {
  background: #6b7280;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.clear-filters-btn:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.browse-link {
  background: #8b5cf6;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.browse-link:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

/* ========================================
   📱 RESPONSIVE DESIGN - COMPACT
======================================== */
@media (max-width: 1024px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .search-group {
    min-width: unset;
  }
  
  .filters-group {
    justify-content: flex-start;
    gap: 10px;
  }
  
  .filter-select {
    min-width: 110px;
  }
  
  .actions-group {
    margin-left: 0;
    justify-content: space-between;
  }
  
  .recommendations-carousel {
    gap: 8px;
  }
  
  .carousel-nav {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .recommendation-card {
    flex: 0 0 260px;
    height: 340px;
  }
  
  .topic-content {
    padding: 12px;
    padding-top: 30px;
  }
  
  .card-actions {
    gap: 6px;
  }
  
  .add-btn,
  .start-btn {
    padding: 7px 10px;
    min-height: 32px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px 12px;
  }
  
  .title {
    font-size: 1.75rem;
    margin-bottom: 24px;
  }
  
  .filter-bar {
    margin-bottom: 24px;
  }
  
  .filter-section {
    padding: 16px;
    gap: 12px;
  }
  
  .filters-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }
  
  .filter-select {
    min-width: unset;
    font-size: 0.8rem;
    padding: 8px 10px;
  }
  
  .search-input {
    font-size: 0.85rem;
    padding: 8px 10px 8px 32px;
  }
  
  .active-filters-row {
    padding: 10px 16px;
    gap: 6px;
  }
  
  .filter-tag {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  
  .recommendations-carousel {
    flex-direction: column;
    gap: 12px;
  }
  
  .carousel-container {
    order: 1;
  }
  
  .carousel-nav {
    display: none;
  }
  
  .recommendation-card {
    flex: 0 0 240px;
    height: 320px;
  }
  
  .topic-content {
    padding: 12px;
    padding-top: 28px;
  }
  
  .topic-title {
    margin-bottom: 5px;
    min-height: 2.4rem;
    font-size: 0.95rem;
  }
  
  .topic-desc {
    margin-bottom: 6px;
    min-height: 2.2rem;
    font-size: 0.75rem;
  }
  
  .topic-stats {
    margin-bottom: 6px;
    padding: 5px 0;
  }
  
  .subject-info {
    margin-bottom: 10px;
  }
  
  .carousel-track {
    gap: 12px;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section h2 {
    font-size: 1.25rem;
  }
  
  .recommendations-section,
  .study-section {
    padding: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
  }
  
  .filter-section {
    padding: 12px;
  }
  
  .search-wrapper {
    margin-bottom: 8px;
  }
  
  .filters-group {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  
  .filter-select {
    font-size: 0.75rem;
    padding: 6px 8px;
  }
  
  .actions-group {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .clear-all-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .user-badge {
    text-align: center;
    padding: 6px 10px;
    font-size: 0.7rem;
  }
  
  .active-filters-row {
    padding: 8px 12px;
    justify-content: center;
  }
  
  .recommendations-section,
  .study-section {
    padding: 16px;
  }
  
  .recommendation-card {
    flex: 0 0 220px;
    height: 300px;
  }
  
  .topic-content {
    padding: 10px;
    padding-top: 26px;
  }
  
  .topic-title {
    margin-bottom: 4px;
    min-height: 2.2rem;
    font-size: 0.9rem;
  }
  
  .topic-desc {
    margin-bottom: 5px;
    min-height: 2rem;
    font-size: 0.7rem;
  }
  
  .topic-stats {
    margin-bottom: 5px;
    padding: 4px 0;
  }
  
  .subject-info {
    margin-bottom: 8px;
  }
  
  .card-actions {
    gap: 5px;
  }
  
  .add-btn,
  .start-btn {
    padding: 6px 8px;
    min-height: 30px;
    font-size: 0.7rem;
  }
  
  .empty-state {
    padding: 40px 16px;
  }
  
  .empty-icon {
    font-size: 2.5rem;
  }
  
  .empty-state h3 {
    font-size: 1.1rem;
  }
}
</style>