<template>
  <div class="topic-overview">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Загрузка информации о курсе...</p>
    </div>

    <!-- Error/Not Found State -->
    <div v-else-if="error || !topic" class="error-container">
      <div class="error-icon">❌</div>
      <h3 class="error-title">{{ error ? 'Ошибка загрузки' : 'Тема не найдена' }}</h3>
      <p class="error-message">{{ error || 'Возможно, тема была удалена или у вас нет к ней доступа' }}</p>
      <button @click="retryLoad" class="btn-retry">🔄 Попробовать снова</button>
      <button @click="$router.push('/profile/catalogue')" class="btn-back">
        ⬅️ Назад к каталогу
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="topic-content">
      <!-- Header with Navigation -->
      <div class="topic-header">
        <button @click="$router.push('/profile/catalogue')" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад к каталогу
        </button>
        
        <div class="topic-hero">
          <div class="topic-info">
            <h1 class="topic-title">
              📘 {{ getTopicName(topic) }}
            </h1>
            <p class="topic-description">{{ getTopicDescription(topic) }}</p>
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
      </div>

      <!-- Lessons Section -->
      <div class="lessons-section">
        <div class="section-header">
          <h2 class="section-title">
            📚 Уроки курса
          </h2>
          
          <!-- Lesson Filters -->
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
          <h3>Уроки не найдены</h3>
          <p>{{ filter !== 'all' ? 'Попробуйте изменить фильтр' : 'В этой теме пока нет уроков' }}</p>
          <button @click="retryLoad" class="retry-btn">🔄 Обновить</button>
        </div>

        <!-- Lessons Grid -->
        <div v-else class="lessons-grid">
          <div
            v-for="(lesson, index) in filteredLessons"
            :key="lesson._id || lesson.id || index"
            class="lesson-card"
            :class="{ 
              locked: lesson.type === 'premium' && !isPremiumUser,
              premium: lesson.type === 'premium'
            }"
          >
            <!-- Lesson Number -->
            <div class="lesson-number">{{ index + 1 }}</div>
            
            <!-- Lesson Type Badge -->
            <div class="lesson-badge" :class="lesson.type || 'free'">
              <span v-if="lesson.type === 'premium'">
                🔒 Премиум
              </span>
              <span v-else>
                ✅ Бесплатно
              </span>
            </div>

            <!-- Lesson Content -->
            <div class="lesson-content">
              <h3 class="lesson-title">{{ getLessonName(lesson) }}</h3>
              <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>
              
              <!-- Lesson Meta -->
              <div class="lesson-meta">
                <span v-if="lesson.steps?.length" class="meta-item">
                  📝 {{ lesson.steps.length }} шагов
                </span>
                <span v-if="lesson.metadata?.estimatedDuration" class="meta-item">
                  ⏱️ {{ lesson.metadata.estimatedDuration }} мин
                </span>
                <span v-if="lesson.homework?.totalExercises > 0" class="meta-item">
                  📚 {{ lesson.homework.totalExercises }} заданий
                </span>
              </div>
            </div>

            <!-- Action Button -->
            <div class="lesson-action">
              <button 
                @click="startLesson(lesson)"
                :disabled="lesson.type === 'premium' && !isPremiumUser"
                class="action-btn"
                :class="{ 
                  locked: lesson.type === 'premium' && !isPremiumUser,
                  premium: lesson.type === 'premium' && !isPremiumUser
                }"
              >
                <span v-if="lesson.type === 'premium' && !isPremiumUser">
                  🔒 Требуется подписка
                </span>
                <span v-else>
                  🚀 Начать урок
                </span>
              </button>
            </div>

            <!-- Lock Overlay for Premium -->
            <div v-if="lesson.type === 'premium' && !isPremiumUser" class="lock-overlay">
              <div class="lock-icon">🔒</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Start Course Section -->
      <div class="start-section">
        <div class="start-content">
          <h3 class="start-title">Готовы начать обучение?</h3>
          <p class="start-description">
            {{ availableCount > 0 
              ? `У вас есть доступ к ${availableCount} урокам из ${lessons.length}` 
              : 'Оформите подписку для доступа ко всем урокам'
            }}
          </p>
          <div class="start-actions">
            <button 
              v-if="availableCount > 0"
              @click="startFirstLesson" 
              class="start-btn primary"
            >
              🚀 Начать первый урок
            </button>
            <button 
              v-else
              @click="handleSubscription" 
              class="start-btn premium"
            >
              ⭐ Оформить подписку
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
        
        
        // Load topic information
        const topicResult = await getTopicById(topicId);
        
        
        if (!topicResult.success && !topicResult.data && !topicResult._id) {
          throw new Error(topicResult.error || 'Failed to load topic');
        }
        
        // ✅ FIXED: Handle different API response structures
        if (topicResult.success) {
          // New API format with success wrapper
          this.topic = topicResult.data;
        } else if (topicResult._id || topicResult.name) {
          // Direct topic object
          this.topic = topicResult;
        } else {
          throw new Error('Invalid topic response format');
        }
        
        if (!this.topic) {
          throw new Error('Topic data is null or undefined');
        }
        

        // Load lessons for this topic
        const lessonsResult = await getLessonsByTopic(topicId);
        
        
        if (lessonsResult.success) {
          // ✅ FIXED: Extract lessons from the correct nested structure
          this.lessons = lessonsResult.data || lessonsResult.lessons || [];
        } else if (Array.isArray(lessonsResult)) {
          // Direct array response
          this.lessons = lessonsResult;
        } else if (lessonsResult.lessons) {
          // Nested lessons property
          this.lessons = lessonsResult.lessons;
        } else if (lessonsResult.data) {
          // Nested data property
          this.lessons = lessonsResult.data;
        } else {
this.lessons = [];
        }
        
        
        // Ensure lessons have proper structure
        this.lessons = this.lessons.map(lesson => ({
          ...lesson,
          type: lesson.type || 'free',
          _id: lesson._id || lesson.id,
          lessonName: lesson.lessonName || lesson.title || lesson.name,
          description: lesson.description || lesson.desc || ''
        }));
        
      } catch (err) {
this.error = this.getErrorMessage(err);
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
this.userPlan = 'free';
        }
        
        // Also check localStorage as fallback
        const storedPlan = localStorage.getItem('subscriptionPlan');
        if (storedPlan && ['premium', 'start', 'pro'].includes(storedPlan)) {
          this.userPlan = storedPlan;
        }
        
      } catch (err) {
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
      if (error.response?.status === 404) {
        return 'Тема не найдена';
      } else if (error.response?.status === 403) {
        return 'У вас нет доступа к этой теме';
      } else if (error.response?.status >= 500) {
        return 'Ошибка сервера. Попробуйте позже.';
      } else if (error.message) {
        return error.message;
      } else {
        return 'Произошла неизвестная ошибка';
      }
    },

    async retryLoad() {
      this.retryCount++;
      await this.loadTopicData();
    },
    
    getTopicName(topic) {
      if (!topic) return 'Без названия';
      // ✅ FIXED: Check multiple possible name fields
      return topic.topicName || 
             topic.name?.en || 
             topic.name?.ru || 
             topic.name?.uz || 
             topic.name || 
             topic.title || 
             'Без названия';
    },
    
    getTopicDescription(topic) {
      if (!topic) return 'Нет описания для этой темы.';
      // ✅ FIXED: Check multiple possible description fields
      return topic.topicDescription || 
             topic.description?.en || 
             topic.description?.ru || 
             topic.description?.uz || 
             topic.description || 
             topic.desc || 
             'Нет описания для этой темы.';
    },
    
    getLessonName(lesson) {
      if (!lesson) return 'Без названия';
      return lesson.lessonName?.en || 
             lesson.lessonName?.ru || 
             lesson.lessonName?.uz || 
             lesson.lessonName || 
             lesson.title || 
             lesson.name || 
             'Без названия';
    },
    
    getLessonDescription(lesson) {
      if (!lesson) return '';
      return lesson.description?.en || 
             lesson.description?.ru || 
             lesson.description?.uz || 
             lesson.description || 
             lesson.desc || 
             '';
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
        }
        
      } catch (error) {
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
  min-height: 70vh;
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
  min-height: 70vh;
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

.btn-back, .btn-retry, .retry-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  margin: 0.25rem;
}

.btn-back:hover, .btn-retry:hover, .retry-btn:hover {
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
  margin-bottom: 2rem;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.topic-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.topic-info {
  flex: 1;
}

.topic-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.topic-description {
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0;
}

/* Topic Stats */
.topic-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  min-width: 280px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
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
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
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

.no-lessons h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.no-lessons p {
  font-size: 1rem;
  margin: 0 0 1rem 0;
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
  transition: all 0.3s ease;
  overflow: hidden;
}

.lesson-card:hover:not(.locked) {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.lesson-card.locked {
  opacity: 0.7;
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
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
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

.action-btn.premium:hover:not(:disabled) {
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
  font-size: 2rem;
  opacity: 0.7;
}

/* Start Section */
.start-section {
  background: white;
  margin: 0 1rem;
  padding: 3rem 2rem;
  border-radius: 0 0 24px 24px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.start-content {
  max-width: 600px;
  margin: 0 auto;
}

.start-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.start-description {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.start-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.start-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 200px;
}

.start-btn.primary {
  background: #3b82f6;
  color: white;
}

.start-btn.primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.start-btn.premium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.start-btn.premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .topic-title {
    font-size: 2rem;
  }
  
  .topic-hero {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .topic-stats {
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
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
  
  .start-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .start-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .lessons-section {
    margin: 0 0.5rem;
    padding: 1.5rem;
  }
  
  .start-section {
    margin: 0 0.5rem;
    padding: 2rem 1.5rem;
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
    font-size: 1.75rem;
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

/* Focus States for Accessibility */
.back-button:focus,
.action-btn:focus,
.start-btn:focus,
.filter-btn:focus,
.btn-back:focus,
.btn-retry:focus,
.retry-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Error handling improvements */
.error-container .error-message {
  max-width: 500px;
  line-height: 1.5;
}

/* Loading improvements */
.loading-container {
  background: rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 2rem;
  padding: 3rem;
}

/* Enhanced lesson card states */
.lesson-card.loading {
  opacity: 0.6;
  pointer-events: none;
}

.lesson-card.error {
  border-color: #ef4444;
  background: #fef2f2;
}

/* Improved accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .lesson-card:hover,
  .action-btn:hover,
  .start-btn:hover,
  .back-button:hover {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .lesson-card {
    border-width: 3px;
  }
  
  .action-btn,
  .start-btn {
    border: 2px solid currentColor;
  }
}

/* Print styles */
@media print {
  .topic-overview {
    background: white !important;
    color: black !important;
  }
  
  .back-button,
  .start-actions,
  .lesson-filters {
    display: none;
  }
  
  .topic-header {
    color: black !important;
  }
  
  .stat-card,
  .lesson-card {
    background: white !important;
    border: 1px solid #ccc !important;
  }
}
</style>