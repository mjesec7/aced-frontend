<template>
  <div class="topic-overview">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Загрузка информации о курсе...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!topic" class="error-container">
      <div class="error-icon">❌</div>
      <h3 class="error-title">Тема не найдена</h3>
      <p class="error-message">Возможно, тема была удалена или у вас нет к ней доступа</p>
      <button @click="$router.push('/catalogue')" class="btn btn-back">
        ⬅️ Назад к каталогу
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="topic-content">
      <!-- Navigation Header -->
      <div class="nav-header">
        <button @click="$router.push('/catalogue')" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад к каталогу
        </button>
      </div>

      <!-- Topic Header -->
      <div class="topic-header">
        <div class="topic-hero">
          <div class="topic-icon">📘</div>
          <div class="topic-info">
            <h1 class="topic-title">{{ getTopicName(topic) }}</h1>
            <p class="topic-description">{{ getTopicDescription(topic) }}</p>
          </div>
        </div>
        
        <!-- Topic Stats -->
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
            <div class="stat-number">{{ availableCount }}</div>
            <div class="stat-label">Доступных</div>
          </div>
        </div>
      </div>

      <!-- Lessons Section -->
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

        <!-- No Lessons State -->
        <div v-if="filteredLessons.length === 0" class="no-lessons">
          <div class="no-lessons-icon">📭</div>
          <h3 class="no-lessons-title">Уроки не найдены</h3>
          <p class="no-lessons-text">
            {{ filter !== 'all' ? 'Попробуйте изменить фильтр' : 'В этой теме пока нет уроков' }}
          </p>
        </div>

        <!-- Lessons Grid -->
        <div v-else class="lessons-grid">
          <div
            v-for="(lesson, index) in filteredLessons"
            :key="lesson._id"
            class="lesson-card"
            :class="{ 
              locked: lesson.type === 'premium' && userPlan === 'free',
              premium: lesson.type === 'premium'
            }"
            @click="startLesson(lesson)"
          >
            <!-- Lesson Number -->
            <div class="lesson-number">{{ index + 1 }}</div>
            
            <!-- Lesson Type Badge -->
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

            <!-- Lesson Content -->
            <div class="lesson-content">
              <h3 class="lesson-title">{{ getLessonName(lesson) }}</h3>
              <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>
              
              <!-- Lesson Meta -->
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

            <!-- Action Button -->
            <div class="lesson-action">
              <button 
                class="action-btn"
                :class="{ 
                  locked: lesson.type === 'premium' && userPlan === 'free',
                  premium: lesson.type === 'premium' && userPlan === 'free'
                }"
                :disabled="lesson.type === 'premium' && userPlan === 'free'"
                @click.stop="startLesson(lesson)"
              >
                <span v-if="lesson.type === 'premium' && userPlan === 'free'">
                  🔒 Требуется подписка
                </span>
                <span v-else>
                  🚀 Начать урок
                </span>
              </button>
            </div>

            <!-- Lock Overlay -->
            <div v-if="lesson.type === 'premium' && userPlan === 'free'" class="lock-overlay">
              <div class="lock-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10H20V20H4V10H6ZM8 10H16V8C16 6.89543 15.1046 6 14 6H10C8.89543 6 8 6.89543 8 8V10Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Section -->
      <div class="action-section">
        <div class="action-content">
          <h3 class="action-title">Готовы начать обучение?</h3>
          <p class="action-description">
            {{ availableCount > 0 
              ? `У вас есть доступ к ${availableCount} урокам из ${lessons.length}` 
              : 'Оформите подписку для доступа ко всем урокам'
            }}
          </p>
          <div class="action-buttons">
            <button 
              v-if="availableCount > 0"
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
              @click="$router.push('/catalogue')" 
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
      userPlan: 'free',
      filter: 'all',
      error: null,
      retryCount: 0
    };
  },
  
  computed: {
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
    
    availableCount() {
      return this.lessons.filter(lesson => 
        lesson.type !== 'premium' || this.isPremiumUser
      ).length;
    },
    
    isPremiumUser() {
      const premiumPlans = ['premium', 'start', 'pro'];
      return premiumPlans.includes(this.userPlan) || 
             premiumPlans.includes(this.getUserSubscription());
    },
    
    currentUser() {
      return auth.currentUser;
    }
  },
  
  async mounted() {
    await this.initializeComponent();
  },
  
  methods: {
    async initializeComponent() {
      try {
        // Wait for authentication if needed
        await this.waitForAuth();
        
        // Load user subscription status
        await this.loadUserPlan();
        
        // Load topic data
        await this.loadTopicData();
        
      } catch (error) {
        console.error('❌ Component initialization failed:', error);
        this.error = 'Ошибка инициализации компонента';
        this.loading = false;
      }
    },
    
    async waitForAuth() {
      if (auth.currentUser) {
        return;
      }
      
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve();
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 3000);
      });
    },
    
    async loadTopicData() {
  const topicId = this.$route.params.id;

  if (!topicId) {
    this.error = 'ID темы не указан';
    this.loading = false;
    return;
  }

  try {
    this.loading = true;
    this.error = null;
    
    console.log('🔍 Loading topic data for ID:', topicId);
    
    // ✅ FIXED: Load topic information with better error handling
    const topicResult = await getTopicById(topicId);
    
    console.log('📘 Topic API Response:', topicResult);
    
    // ✅ CRITICAL FIX: Handle all possible API response structures
    let topicData = null;
    
    if (topicResult) {
      // Case 1: New API format with success wrapper
      if (topicResult.success === true && topicResult.data) {
        topicData = topicResult.data;
        console.log('✅ Using success wrapper format');
      }
      // Case 2: New API format with exists flag  
      else if (topicResult.exists === true && topicResult.data) {
        topicData = topicResult.data;
        console.log('✅ Using exists wrapper format');
      }
      // Case 3: Direct topic object (has MongoDB _id or name)
      else if (topicResult._id || topicResult.name) {
        topicData = topicResult;
        console.log('✅ Using direct topic object');
      }
      // Case 4: Check if it has topic properties even without success flag
      else if (topicResult.topicName || topicResult.subject || topicResult.level) {
        topicData = topicResult;
        console.log('✅ Using topic with topic properties');
      }
      // Case 5: Nested in data property without success flag
      else if (topicResult.data && (topicResult.data._id || topicResult.data.name)) {
        topicData = topicResult.data;
        console.log('✅ Using nested data format');
      }
    }
    
    // ✅ FIXED: Check if we actually got topic data
    if (!topicData) {
      console.error('❌ No valid topic data found in response:', topicResult);
      
      // Check if it's a 404 or actual error
      if (topicResult && topicResult.success === false) {
        throw new Error(topicResult.message || topicResult.error || 'Topic not found');
      } else {
        throw new Error('Invalid topic response format');
      }
    }
    
    this.topic = topicData;
    console.log('✅ Topic loaded successfully:', this.topic);

    // ✅ FIXED: Load lessons for this topic with better error handling
    try {
      const lessonsResult = await getLessonsByTopic(topicId);
      console.log('📚 Lessons API Response:', lessonsResult);
      
      // Handle different lesson response structures
      let lessonsData = [];
      
      if (lessonsResult) {
        if (lessonsResult.success === true && Array.isArray(lessonsResult.data)) {
          lessonsData = lessonsResult.data;
        } else if (lessonsResult.success === true && Array.isArray(lessonsResult.lessons)) {
          lessonsData = lessonsResult.lessons;
        } else if (Array.isArray(lessonsResult.data)) {
          lessonsData = lessonsResult.data;
        } else if (Array.isArray(lessonsResult.lessons)) {
          lessonsData = lessonsResult.lessons;
        } else if (Array.isArray(lessonsResult)) {
          lessonsData = lessonsResult;
        }
      }
      
      console.log(`📚 Found ${lessonsData.length} lessons`);
      
      // ✅ Ensure lessons have proper structure
      this.lessons = lessonsData.map(lesson => ({
        ...lesson,
        type: lesson.type || 'free',
        _id: lesson._id || lesson.id,
        lessonName: lesson.lessonName || lesson.title || lesson.name,
        description: lesson.description || lesson.desc || ''
      }));
      
    } catch (lessonError) {
      console.warn('⚠️ Error loading lessons (non-fatal):', lessonError.message);
      // Don't fail the whole component if lessons fail
      this.lessons = [];
    }
    
  } catch (err) {
    console.error('❌ Error loading topic data:', err);
    
    // ✅ ENHANCED: Better error message based on error type
    if (err.response?.status === 404) {
      this.error = 'Тема не найдена';
    } else if (err.response?.status === 403) {
      this.error = 'У вас нет доступа к этой теме';
    } else if (err.response?.status >= 500) {
      this.error = 'Ошибка сервера. Попробуйте позже.';
    } else if (err.message === 'Network Error') {
      this.error = 'Ошибка сети. Проверьте подключение к интернету.';
    } else if (err.message.includes('Topic not found')) {
      this.error = 'Тема не найдена или была удалена';
    } else {
      this.error = err.message || 'Произошла неизвестная ошибка';
    }
    
    this.topic = null;
    this.lessons = [];
    
  } finally {
    this.loading = false;
  }
},
    
    async loadUserPlan() {
      try {
        if (!auth.currentUser) {
          this.userPlan = 'free';
          return;
        }

        const userId = auth.currentUser.uid;

        const statusResult = await getUserStatus(userId);
        
        if (statusResult.success) {
          this.userPlan = statusResult.status || statusResult.data?.subscriptionPlan || 'free';
        } else {
          console.warn('⚠️ Failed to load user status, defaulting to free');
          this.userPlan = 'free';
        }
        
        // Also check localStorage as fallback
        const storedPlan = localStorage.getItem('subscriptionPlan');
        if (storedPlan && ['premium', 'start', 'pro'].includes(storedPlan)) {
          this.userPlan = storedPlan;
        }
        
      } catch (err) {
        console.warn('⚠️ Error loading user plan:', err.message);
        this.userPlan = 'free';
      }
    },

    getUserSubscription() {
      // Multiple sources for subscription status
      return this.$store?.state?.user?.subscriptionPlan || 
             this.$store?.getters?.userStatus || 
             localStorage.getItem('subscriptionPlan') || 
             'free';
    },
    
    getErrorMessage(error) {
      try {
        if (!error) return 'Произошла неизвестная ошибка';
        
        if (error.response?.status === 404) {
          return 'Тема не найдена';
        } else if (error.response?.status === 403) {
          return 'У вас нет доступа к этой теме';
        } else if (error.response?.status >= 500) {
          return 'Ошибка сервера. Попробуйте позже.';
        } else if (error.message && typeof error.message === 'string') {
          return error.message;
        } else if (typeof error === 'string') {
          return error;
        } else {
          return 'Произошла неизвестная ошибка';
        }
      } catch (errorProcessingError) {
        console.error('❌ Error processing error message:', errorProcessingError);
        return 'Произошла неизвестная ошибка';
      }
    },

    async retryLoad() {
      this.retryCount++;
      await this.loadTopicData();
    },
    
    // ✅ FIXED: Updated getTopicName function with better error handling
    getTopicName(topic) {
      try {
        if (!topic) {
          console.warn('⚠️ getTopicName: topic is null/undefined');
          return 'Без названия';
        }
        
        console.log('🔍 Topic object structure for name:', topic);
        
        // ✅ SAFETY: Check for simple string name first (what your backend actually returns)
        if (topic.name && typeof topic.name === 'string' && topic.name.trim()) {
          return topic.name.trim();
        }
        
        // ✅ SAFETY: Then check for localized names (if you want to support this later)
        if (topic.name && typeof topic.name === 'object') {
          const localizedName = topic.name.en || 
                               topic.name.ru || 
                               topic.name.uz || 
                               topic.name.default;
          
          if (localizedName && typeof localizedName === 'string') {
            return localizedName.trim();
          }
          
          // Get first available translation
          const values = Object.values(topic.name);
          for (const value of values) {
            if (value && typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
        }
        
        // ✅ SAFETY: Check for other possible name fields
        if (topic.topicName && typeof topic.topicName === 'string') {
          return topic.topicName.trim();
        }
        
        if (topic.title && typeof topic.title === 'string') {
          return topic.title.trim();
        }
        
        if (topic.displayName && typeof topic.displayName === 'string') {
          return topic.displayName.trim();
        }
        
        console.warn('⚠️ No valid name found in topic object');
        return 'Без названия';
        
      } catch (error) {
        console.error('❌ Error in getTopicName:', error);
        return 'Без названия';
      }
    },
    
    // ✅ FIXED: Updated getTopicDescription function with better error handling
    getTopicDescription(topic) {
      try {
        if (!topic) {
          console.warn('⚠️ getTopicDescription: topic is null/undefined');
          return 'Нет описания для этой темы.';
        }
        
        console.log('🔍 Topic description structure:', topic.description);
        
        // ✅ SAFETY: Check for simple string description first
        if (topic.description && typeof topic.description === 'string' && topic.description.trim()) {
          return topic.description.trim();
        }
        
        // ✅ SAFETY: Then check for localized descriptions
        if (topic.description && typeof topic.description === 'object') {
          const localizedDesc = topic.description.en || 
                               topic.description.ru || 
                               topic.description.uz || 
                               topic.description.default;
          
          if (localizedDesc && typeof localizedDesc === 'string') {
            return localizedDesc.trim();
          }
          
          // Get first available translation
          const values = Object.values(topic.description);
          for (const value of values) {
            if (value && typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
        }
        
        // ✅ SAFETY: Check for other possible description fields
        if (topic.topicDescription && typeof topic.topicDescription === 'string') {
          return topic.topicDescription.trim();
        }
        
        if (topic.desc && typeof topic.desc === 'string') {
          return topic.desc.trim();
        }
        
        if (topic.summary && typeof topic.summary === 'string') {
          return topic.summary.trim();
        }
        
        console.warn('⚠️ No valid description found in topic object');
        return 'Нет описания для этой темы.';
        
      } catch (error) {
        console.error('❌ Error in getTopicDescription:', error);
        return 'Нет описания для этой темы.';
      }
    },
    
    // ✅ FIXED: Updated getLessonName function with better error handling
    getLessonName(lesson) {
      try {
        if (!lesson) {
          console.warn('⚠️ getLessonName: lesson is null/undefined');
          return 'Без названия';
        }
        
        // ✅ SAFETY: Check for simple string first
        if (lesson.lessonName && typeof lesson.lessonName === 'string' && lesson.lessonName.trim()) {
          return lesson.lessonName.trim();
        }
        
        if (lesson.title && typeof lesson.title === 'string' && lesson.title.trim()) {
          return lesson.title.trim();
        }
        
        if (lesson.name && typeof lesson.name === 'string' && lesson.name.trim()) {
          return lesson.name.trim();
        }
        
        // ✅ SAFETY: Then check for localized names
        if (lesson.lessonName && typeof lesson.lessonName === 'object') {
          const localizedName = lesson.lessonName.en || 
                               lesson.lessonName.ru || 
                               lesson.lessonName.uz;
          
          if (localizedName && typeof localizedName === 'string') {
            return localizedName.trim();
          }
          
          const values = Object.values(lesson.lessonName);
          for (const value of values) {
            if (value && typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
        }
        
        if (lesson.name && typeof lesson.name === 'object') {
          const localizedName = lesson.name.en || 
                               lesson.name.ru || 
                               lesson.name.uz;
          
          if (localizedName && typeof localizedName === 'string') {
            return localizedName.trim();
          }
          
          const values = Object.values(lesson.name);
          for (const value of values) {
            if (value && typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
        }
        
        console.warn('⚠️ No valid lesson name found');
        return 'Без названия';
        
      } catch (error) {
        console.error('❌ Error in getLessonName:', error);
        return 'Без названия';
      }
    },
    
    // ✅ FIXED: Updated getLessonDescription function with better error handling
    getLessonDescription(lesson) {
      try {
        if (!lesson) {
          console.warn('⚠️ getLessonDescription: lesson is null/undefined');
          return '';
        }
        
        // ✅ SAFETY: Check for simple string first
        if (lesson.description && typeof lesson.description === 'string' && lesson.description.trim()) {
          return lesson.description.trim();
        }
        
        if (lesson.desc && typeof lesson.desc === 'string' && lesson.desc.trim()) {
          return lesson.desc.trim();
        }
        
        // ✅ SAFETY: Then check for localized descriptions
        if (lesson.description && typeof lesson.description === 'object') {
          const localizedDesc = lesson.description.en || 
                               lesson.description.ru || 
                               lesson.description.uz;
          
          if (localizedDesc && typeof localizedDesc === 'string') {
            return localizedDesc.trim();
          }
          
          const values = Object.values(lesson.description);
          for (const value of values) {
            if (value && typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
        }
        
        if (lesson.summary && typeof lesson.summary === 'string') {
          return lesson.summary.trim();
        }
        
        return '';
        
      } catch (error) {
        console.error('❌ Error in getLessonDescription:', error);
        return '';
      }
    },
    
    startLesson(lesson) {
      if (lesson.type === 'premium' && !this.isPremiumUser) {
        this.handleSubscription();
        return;
      }
      
      const lessonId = lesson._id || lesson.id;
      this.$router.push({ name: 'LessonPage', params: { id: lessonId } });
    },
    
    startFirstLesson() {
      const firstAvailable = this.lessons.find(
        lesson => lesson.type !== 'premium' || this.isPremiumUser
      );
      
      if (firstAvailable) {
        this.startLesson(firstAvailable);
      } else {
        this.handleSubscription();
      }
    },
    
    handleSubscription() {
      this.$router.push({
        name: 'PaymePayment',
        params: { plan: 'start' },
        query: { 
          returnTo: this.$route.fullPath,
          from: 'topic',
          topicId: this.topic?._id || this.topic?.id
        }
      });
    },
    
    // Safe payment check method to avoid errors
    async checkPaymentStatus() {
      try {
        // Only check if user is authenticated and we have store
        if (!auth.currentUser || !this.$store) {
          return;
        }
        
        // Check if dispatch method exists and returns a promise
        const checkAction = this.$store.dispatch('user/checkPendingPayments');
        
        if (checkAction && typeof checkAction.catch === 'function') {
          await checkAction;
        } else {
          console.log('⚠️ Payment check action not available');
        }
        
      } catch (error) {
        console.warn('⚠️ Payment status check failed:', error.message);
        // Don't throw error, just log it
      }
    }
  },
  
  // Lifecycle hook to check payment status periodically
  async created() {
    // Initial payment check
    await this.checkPaymentStatus();
    
    // Set up periodic payment check (every 5 minutes)
    this.paymentCheckInterval = setInterval(() => {
      this.checkPaymentStatus();
    }, 5 * 60 * 1000);
  },
  
  beforeUnmount() {
    // Clean up interval
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
    }
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