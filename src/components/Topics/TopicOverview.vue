<template>
  <div class="topic-overview">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Загрузка информации о курсе...</p>
    </div>

    <!-- Error/Not Found State -->
    <div v-else-if="!topic" class="error-container">
      <div class="error-icon">❌</div>
      <h3 class="error-title">Тема не найдена</h3>
      <p class="error-message">Возможно, тема была удалена или у вас нет к ней доступа</p>
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
              locked: lesson.type === 'premium' && userPlan === 'free',
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
                :disabled="lesson.type === 'premium' && userPlan === 'free'"
                class="action-btn"
                :class="{ 
                  locked: lesson.type === 'premium' && userPlan === 'free',
                  premium: lesson.type === 'premium' && userPlan === 'free'
                }"
              >
                <span v-if="lesson.type === 'premium' && userPlan === 'free'">
                  🔒 Требуется подписка
                </span>
                <span v-else>
                  🚀 Начать урок
                </span>
              </button>
            </div>

            <!-- Lock Overlay for Premium -->
            <div v-if="lesson.type === 'premium' && userPlan === 'free'" class="lock-overlay">
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
import axios from 'axios';
import { auth } from '@/firebase';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: null,
      lessons: [],
      loading: true,
      userPlan: 'free',
      filter: 'all'
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
        lesson.type !== 'premium' || this.userPlan !== 'free'
      ).length;
    }
  },
  
  async mounted() {
    await this.loadTopicData();
  },
  
  methods: {
    async loadTopicData() {
      const topicId = this.$route.params.id;
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;

      if (!topicId) {
        this.loading = false;
        return;
      }

      try {
        this.loading = true;
        
        // Load user plan first
        await this.loadUserPlan();
        
        // Load topic data
        const topicRes = await axios.get(`${BASE_URL}/topics/${topicId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Handle different response formats
        this.topic = topicRes.data?.topic || topicRes.data?.data || topicRes.data;

        // Load lessons with cache busting
        const lessonsRes = await axios.get(`${BASE_URL}/topics/${topicId}/lessons`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          params: {
            // Add timestamp to bust cache
            _t: Date.now()
          }
        });
        
        // Handle different response formats and extract lessons
        let lessonsData = null;
        
        if (lessonsRes.data) {
          // Try different possible response structures
          lessonsData = lessonsRes.data.lessons || 
                       lessonsRes.data.data || 
                       lessonsRes.data.result ||
                       lessonsRes.data;
        }
        
        // Ensure we have an array
        if (Array.isArray(lessonsData)) {
          this.lessons = lessonsData;
        } else if (lessonsData && typeof lessonsData === 'object') {
          // If it's an object, maybe lessons are in a property
          this.lessons = lessonsData.lessons || lessonsData.items || [];
        } else {
          this.lessons = [];
        }
        
      } catch (err) {
        this.topic = null;
        this.lessons = [];
      } finally {
        this.loading = false;
      }
    },
    
    async loadUserPlan() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const headers = { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          };

          const statusRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${auth.currentUser.uid}/status`, { headers });
          this.userPlan = statusRes.data?.status || statusRes.data?.subscriptionPlan || 'free';
        }
      } catch (err) {
        this.userPlan = 'free';
      }
    },

    async retryLoad() {
      await this.loadTopicData();
    },
    
    getTopicName(topic) {
      if (!topic) return 'Без названия';
      return topic.name?.en || topic.name || topic.title || 'Без названия';
    },
    
    getTopicDescription(topic) {
      if (!topic) return 'Нет описания для этой темы.';
      return topic.description?.en || topic.description || topic.desc || 'Нет описания для этой темы.';
    },
    
    getLessonName(lesson) {
      if (!lesson) return 'Без названия';
      return lesson.lessonName?.en || lesson.lessonName || lesson.title || lesson.name || 'Без названия';
    },
    
    getLessonDescription(lesson) {
      if (!lesson) return '';
      return lesson.description?.en || lesson.description || lesson.desc || '';
    },
    
    startLesson(lesson) {
      if (lesson.type === 'premium' && this.userPlan === 'free') {
        this.handleSubscription();
        return;
      }
      
      const lessonId = lesson._id || lesson.id;
      this.$router.push({ name: 'LessonPage', params: { id: lessonId } });
    },
    
    startFirstLesson() {
      const firstAvailable = this.lessons.find(
        lesson => lesson.type !== 'premium' || this.userPlan !== 'free'
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
</style>