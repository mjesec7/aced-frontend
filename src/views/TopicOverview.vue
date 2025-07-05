<template>
  <div class="topic-overview">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Загрузка информации о курсе...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Ошибка загрузки</h3>
      <p>{{ error }}</p>
      <button @click="retryLoad" class="retry-btn">🔄 Попробовать снова</button>
      <button @click="$router.push('/catalogue')" class="back-btn">⬅️ Назад к каталогу</button>
    </div>

    <div v-else-if="topic" class="topic-card">
      <div class="topic-header">
        <button @click="$router.push('/catalogue')" class="back-button">
          ⬅️ Назад
        </button>
        <h1 class="title">📘 {{ getTopicName(topic) }}</h1>
        <p class="description">{{ getTopicDescription(topic) }}</p>
        
        <!-- Topic stats if available -->
        <div v-if="topicStats" class="topic-stats">
          <div class="stat-item">
            <span class="stat-number">{{ lessons.length }}</span>
            <span class="stat-label">уроков</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ freeCount }}</span>
            <span class="stat-label">бесплатных</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ premiumCount }}</span>
            <span class="stat-label">премиум</span>
          </div>
        </div>
      </div>

      <div class="lesson-list">
        <div class="lessons-header">
          <h2>📚 Уроки</h2>
          <div class="lesson-filter">
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
          <h3>Уроки не найдены</h3>
          <p v-if="filter !== 'all'">Попробуйте изменить фильтр</p>
          <p v-else>В этой теме пока нет уроков</p>
        </div>

        <div v-else class="lesson-grid">
          <div
            v-for="(lesson, index) in filteredLessons"
            :key="lesson._id"
            class="lesson-card"
            :class="{ 
              locked: lesson.type === 'premium' && !isPremiumUser,
              completed: isLessonCompleted(lesson._id)
            }"
          >
            <div class="card-header">
              <div class="lesson-number">{{ index + 1 }}</div>
              <span class="lesson-type" :class="lesson.type === 'premium' ? 'premium' : 'free'">
                {{ lesson.type === 'premium' ? '🔒 Премиум' : '✅ Бесплатно' }}
              </span>
            </div>
            
            <div class="card-content">
              <h3 class="lesson-name">{{ getLessonName(lesson) }}</h3>
              <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>
              
              <!-- Lesson progress if available -->
              <div v-if="getLessonProgress(lesson._id)" class="lesson-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getLessonProgress(lesson._id).progressPercent + '%' }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ getLessonProgress(lesson._id).progressPercent }}% завершено
                </span>
              </div>

              <!-- Lesson stats -->
              <div class="lesson-meta">
                <span v-if="lesson.stats?.viewCount" class="meta-item">
                  👁️ {{ lesson.stats.viewCount }}
                </span>
                <span v-if="lesson.metadata?.estimatedDuration" class="meta-item">
                  ⏱️ {{ lesson.metadata.estimatedDuration }} мин
                </span>
                <span v-if="lesson.steps?.length" class="meta-item">
                  📝 {{ lesson.steps.length }} шагов
                </span>
              </div>
            </div>
            
            <div class="card-actions">
              <button
                @click="startLesson(lesson)"
                :disabled="lesson.type === 'premium' && !isPremiumUser"
                class="lesson-action-btn"
                :class="{
                  'premium-locked': lesson.type === 'premium' && !isPremiumUser,
                  'continue': isLessonStarted(lesson._id),
                  'completed': isLessonCompleted(lesson._id)
                }"
              >
                <span v-if="lesson.type === 'premium' && !isPremiumUser">
                  🔒 Требуется подписка
                </span>
                <span v-else-if="isLessonCompleted(lesson._id)">
                  ✅ Пройден
                </span>
                <span v-else-if="isLessonStarted(lesson._id)">
                  ▶️ Продолжить
                </span>
                <span v-else>
                  🚀 Начать
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="start-button-wrapper">
        <button 
          class="start-course-btn" 
          @click="startFirstLesson"
          :disabled="availableLessons.length === 0"
        >
          <span v-if="availableLessons.length === 0">
            🔒 Нет доступных уроков
          </span>
          <span v-else>
            🚀 Начать курс
          </span>
        </button>
        
        <button 
          v-if="isPremiumUser || freeCount > 0" 
          @click="showLessonOverview = !showLessonOverview"
          class="toggle-overview-btn"
        >
          {{ showLessonOverview ? '🔼 Скрыть обзор' : '🔽 Показать обзор' }}
        </button>
      </div>

      <!-- Lesson Overview Modal -->
      <div v-if="showLessonOverview" class="lesson-overview-modal" @click="showLessonOverview = false">
        <div class="overview-content" @click.stop>
          <div class="overview-header">
            <h3>📋 Обзор уроков</h3>
            <button @click="showLessonOverview = false" class="close-btn">✕</button>
          </div>
          <div class="overview-list">
            <div v-for="(lesson, index) in lessons" :key="lesson._id" class="overview-item">
              <div class="overview-number">{{ index + 1 }}</div>
              <div class="overview-info">
                <h4>{{ getLessonName(lesson) }}</h4>
                <p>{{ getLessonDescription(lesson) }}</p>
                <div class="overview-meta">
                  <span :class="['overview-type', lesson.type]">
                    {{ lesson.type === 'premium' ? 'Премиум' : 'Бесплатно' }}
                  </span>
                  <span v-if="lesson.metadata?.estimatedDuration">
                    ⏱️ {{ lesson.metadata.estimatedDuration }} мин
                  </span>
                </div>
              </div>
              <button 
                @click="startLesson(lesson)" 
                :disabled="lesson.type === 'premium' && !isPremiumUser"
                class="overview-start-btn"
              >
                {{ lesson.type === 'premium' && !isPremiumUser ? '🔒' : '▶️' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <div class="error-icon">🔍</div>
      <h3>Тема не найдена</h3>
      <p>Возможно, тема была удалена или у вас нет к ней доступа</p>
      <button @click="$router.push('/catalogue')" class="back-btn">⬅️ Назад к каталогу</button>
    </div>
  </div>
</template>

<script>
// ✅ FIXED: Updated TopicOverview.vue with proper API integration
import { auth } from '@/firebase';
import { mapGetters } from 'vuex';
import { 
  getTopicById, 
  getLessonsByTopic, 
  getUserStatus,
  getUserProgress 
} from '@/api';

export default {
  name: 'TopicOverview',
  data() {
    return {
      topic: null,
      lessons: [],
      loading: true,
      error: null,
      userProgress: [],
      filter: 'all',
      showLessonOverview: false,
      topicStats: null,
      retryCount: 0
    };
  },
  
  computed: {
    ...mapGetters('user', ['isPremiumUser', 'userStatus']),
    
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
    
    availableLessons() {
      return this.lessons.filter(lesson => 
        lesson.type !== 'premium' || this.isPremiumUser
      );
    }
  },
  
  async mounted() {
    await this.loadTopicData();
  },
  
  methods: {
    async loadTopicData() {
      const topicId = this.$route.params.id;
      
      console.log('🔍 TopicOverview mounted for topic:', topicId);
      
      try {
        this.loading = true;
        this.error = null;

        // Load user status if authenticated
        if (auth.currentUser) {
          try {
            const statusResult = await getUserStatus(auth.currentUser.uid);
            if (statusResult.success) {
              this.$store.commit('user/setSubscriptionPlan', statusResult.status);
            }
            console.log('📦 User status loaded:', statusResult.status);
          } catch (statusError) {
            console.warn('⚠️ Failed to fetch user status:', statusError.message);
          }
        }

        // Load topic data
        console.log('📘 Loading topic data...');
        const topicResult = await getTopicById(topicId);
        
        if (topicResult.success) {
          this.topic = topicResult.data;
          console.log('✅ Topic loaded:', this.topic.name);
        } else {
          throw new Error(topicResult.error || 'Failed to load topic');
        }

        // Load lessons for this topic
        console.log('📚 Loading lessons for topic...');
        const lessonsResult = await getLessonsByTopic(topicId);
        
        if (lessonsResult.success) {
          this.lessons = lessonsResult.data || [];
          this.topicStats = lessonsResult.stats;
          console.log('✅ Lessons loaded:', this.lessons.length);
        } else {
          console.warn('⚠️ Failed to load lessons:', lessonsResult.error);
          this.lessons = [];
        }

        // Load user progress if authenticated
        if (auth.currentUser) {
          try {
            const progressResult = await getUserProgress(auth.currentUser.uid);
            if (progressResult.success) {
              this.userProgress = progressResult.data || [];
            }
          } catch (progressError) {
            console.warn('⚠️ Failed to load user progress:', progressError.message);
          }
        }

      } catch (err) {
        console.error('❌ Error in TopicOverview:', err);
        
        // Set specific error messages
        if (err.message === 'Topic not found') {
          this.error = 'Тема не найдена';
        } else if (err.response?.status === 403) {
          this.error = 'У вас нет доступа к этой теме';
        } else if (err.response?.status === 500) {
          this.error = 'Ошибка сервера. Попробуйте позже.';
        } else {
          this.error = 'Произошла ошибка при загрузке данных';
        }
        
        this.topic = null;
        this.lessons = [];
      } finally {
        this.loading = false;
      }
    },

    async retryLoad() {
      this.retryCount++;
      console.log(`🔄 Retrying load attempt ${this.retryCount}`);
      await this.loadTopicData();
    },

    getTopicName(topic) {
      if (!topic) return 'Без названия';
      return topic.name?.en || topic.name || 'Без названия';
    },

    getTopicDescription(topic) {
      if (!topic) return 'Нет описания для этой темы.';
      return topic.description?.en || topic.description || 'Нет описания для этой темы.';
    },

    getLessonName(lesson) {
      if (!lesson) return 'Без названия';
      return lesson.lessonName?.en || lesson.lessonName || 'Без названия';
    },

    getLessonDescription(lesson) {
      if (!lesson) return '';
      return lesson.description?.en || lesson.description || '';
    },

    getLessonProgress(lessonId) {
      return this.userProgress.find(progress => 
        progress.lessonId === lessonId || 
        progress.lessonId?._id === lessonId
      );
    },

    isLessonStarted(lessonId) {
      const progress = this.getLessonProgress(lessonId);
      return progress && progress.completedSteps && progress.completedSteps.length > 0;
    },

    isLessonCompleted(lessonId) {
      const progress = this.getLessonProgress(lessonId);
      return progress && progress.completed;
    },

    startLesson(lesson) {
      console.log('➡️ Start lesson clicked:', lesson._id);
      
      if (lesson.type === 'premium' && !this.isPremiumUser) {
        this.$router.push({
          name: 'PaymentPage',
          query: { 
            from: 'lesson',
            lessonId: lesson._id,
            topicId: this.topic._id 
          }
        });
        return;
      }
      
      this.$router.push({ name: 'LessonPage', params: { id: lesson._id } });
    },

    startFirstLesson() {
      const first = this.availableLessons[0];
      if (first) {
        console.log('🚀 Starting first available lesson:', first._id);
        this.startLesson(first);
      } else {
        if (this.premiumCount > 0 && !this.isPremiumUser) {
          this.$router.push({
            name: 'PaymentPage',
            query: { 
              from: 'topic',
              topicId: this.topic._id 
            }
          });
        } else {
          alert('❌ Нет доступных уроков в этой теме.');
        }
      }
    }
  }
};
</script>



<style scoped>
.topic-overview {
  max-width: 960px;
  margin: 0 auto;
  padding: 50px 24px;
  font-family: 'Unbounded', sans-serif;
  color: #1f2937;
}

.loading,
.error {
  text-align: center;
  font-size: 1.2rem;
  color: #6b7280;
}

.title {
  font-size: 2.8rem;
  font-weight: 700;
  color: #5b21b6;
  margin-bottom: 24px;
  text-align: center;
}

.description {
  font-size: 1.2rem;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 36px;
  text-align: center;
}

.lesson-list h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #6b21a8;
}

.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 8px rgba(93, 97, 120, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lesson-item:hover {
  transform: scale(1.01);
  box-shadow: 0 6px 12px rgba(93, 97, 120, 0.12);
}

.lesson-item.locked {
  opacity: 0.5;
  pointer-events: none;
}

.lesson-item button {
  padding: 8px 18px;
  background: linear-gradient(to right, #7c3aed, #6d28d9);
  color: #fff;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s ease;
}

.lesson-item button:hover {
  transform: scale(1.05);
  background: linear-gradient(to right, #5b21b6, #6b21a8);
}

.start-button-wrapper {
  text-align: center;
  margin-top: 50px;
}

.start-course-btn {
  padding: 16px 36px;
  font-size: 1.2rem;
  font-weight: 600;
  background: linear-gradient(to right, #6d28d9, #7c3aed);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s ease;
}

.start-course-btn:hover {
  transform: scale(1.05);
  background: linear-gradient(to right, #5b21b6, #6b21a8);
}
</style>
