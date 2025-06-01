<template>
  <div class="lessons-page">
    <div class="page-header">
      <h1 class="page-title">Каталог Уроков</h1>
      <span class="subscription-badge" :class="subscriptionClass">
        {{ subscriptionText }}
      </span>
    </div>

    <div class="controls">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="🔍 Поиск уроков или тем..."
      />
      <select v-model="filterType" class="filter-select">
        <option value="all">Все</option>
        <option value="free">Бесплатные</option>
        <option value="premium">Премиум</option>
        <option value="in-progress">В процессе</option>
        <option value="completed">Завершенные</option>
      </select>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>Загрузка уроков...</span>
    </div>

    <div v-else-if="groupedTopics && groupedTopics.length" class="lessons-grid">
      <div v-for="topic in groupedTopics" :key="topic.topicId" class="lesson-card">
        <div class="card-header">
          <h2 class="lesson-title">{{ topic.name || 'Без названия' }}</h2>
          <button class="add-btn" @click="addToStudyPlan(topic)" :disabled="topic.inStudyPlan">
            {{ topic.inStudyPlan ? '✓' : '＋' }}
          </button>
        </div>
        
        <p class="lesson-topic">
          <span class="topic-info">📚 {{ topic.subject || 'Без предмета' }}</span>
          <span class="level-badge" :class="getLevelClass(topic.level)">
            {{ topic.level || 'Базовый' }}
          </span>
        </p>
        
        <p class="lesson-stats">
          <span>📅 {{ topic.lessonCount || 0 }} уроков</span>
          <span>⏱️ {{ topic.totalTime || 0 }} мин</span>
        </p>

        <!-- Progress Section -->
        <div class="progress-section" v-if="topic.progress !== undefined && topic.progress !== null">
          <div class="progress-header">
            <span class="progress-label">Прогресс</span>
            <span class="progress-percentage">{{ Math.round(topic.progress || 0) }}%</span>
          </div>
          
          <!-- Modern Progress Bar -->
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (topic.progress || 0) + '%' }"
                :class="getProgressClass(topic.progress || 0)"
              ></div>
            </div>
          </div>
          
   
         
        </div>

        <!-- Status Badges -->
        <div class="status-section">
          <span class="access-label" :class="(topic.type === 'premium') ? 'paid' : 'free'">
            {{ (topic.type === 'premium') ? '⭐ Премиум' : '🆓 Бесплатный' }}
          </span>
          
          <div class="status-badges">
            <span v-if="(topic.progress || 0) === 100" class="status-badge completed">
              ✅ Завершен
            </span>
            <span v-else-if="(topic.progress || 0) > 0" class="status-badge in-progress">
              🔄 В процессе
            </span>
            <span v-else class="status-badge not-started">
              ⭕ Не начат
            </span>
          </div>
        </div>

        <button 
          class="start-btn" 
          @click="handleAccess(topic.topicId, topic.type)"
          :class="getButtonClass(topic.progress || 0)"
        >
          {{ getButtonText(topic.progress || 0) }}
        </button>
      </div>
    </div>

    <div v-else class="no-lessons">
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Уроки не найдены</h3>
        <p>Попробуйте изменить параметры поиска или фильтра</p>
      </div>
    </div>

    <!-- Enhanced Modals -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showAddModal = false">×</button>
        <div class="modal-header">
          <h3>📚 Добавить в учебный план</h3>
        </div>
        <div class="modal-body">
          <div class="topic-preview" v-if="selectedTopic">
            <h4>{{ selectedTopic.name || 'Без названия' }}</h4>
            <p>{{ selectedTopic.subject || 'Без предмета' }} • {{ selectedTopic.level || 'Базовый' }}</p>
            <div class="topic-stats">
              <span>📅 {{ selectedTopic.lessonCount || 0 }} уроков</span>
              <span>⏱️ {{ selectedTopic.totalTime || 0 }} минут</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddModal = false">Отмена</button>
          <button class="btn-primary" @click="confirmAddToStudyPlan">
            ✅ Добавить
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click="showSuccessModal = false">
      <div class="modal-content success-modal" @click.stop>
        <button class="modal-close" @click="showSuccessModal = false">×</button>
        <div class="success-content">
          <div class="success-icon">✅</div>
          <h3>Успешно добавлено!</h3>
          <p>Тема "{{ selectedTopic?.name || 'Без названия' }}" добавлена в ваш учебный план.</p>
          <button class="btn-primary" @click="showSuccessModal = false">
            Понятно
          </button>
        </div>
      </div>
    </div>

    <PaymentModal
      v-if="showPaywall"
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="handlePlanUpdate"
    />
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';
import { auth } from '@/firebase';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { 
    PaymentModal 
  },
  data() {
    return {
      lessons: [],
      groupedTopics: [],
      originalTopics: [],
      userProgress: {},
      lessonProgress: {}, // This was missing!
      studyPlanTopics: [],
      loading: true,
      userId: null,
      filterType: 'all',
      searchQuery: '',
      showPaywall: false,
      requestedTopicId: null,
      lang: '',
      showAddModal: false,
      showSuccessModal: false,
      selectedTopic: null,
      circumference: 2 * Math.PI * 16, // for the pie chart
      plan: null
    };
  },
  computed: {
    ...mapGetters('user', ['isPremiumUser', 'userStatus']),
    subscriptionClass() {
      const status = this.userStatus || 'free';
      return status === 'pro' ? 'badge-pro'
        : status === 'start' ? 'badge-start'
        : 'badge-free';
    },
    subscriptionText() {
      const status = this.userStatus || 'free';
      return status === 'pro' ? 'Pro подписка'
        : status === 'start' ? 'Start подписка'
        : 'Бесплатный доступ';
    }
  },
  async mounted() {
    await this.initializeComponent();
    await this.loadLessonProgress(); // Load lesson progress after initialization
  },
  methods: {
    async initializeComponent() {
      try {
        // Initialize language
        this.lang = localStorage.getItem('lang') || 'en';
        
        // Get user ID
        const storedId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
        if (!storedId) {
          this.loading = false;
          return;
        }
        this.userId = storedId;

        // Load all data
        await Promise.all([
          this.loadLessons(),
          this.loadUserProgress(),
          this.loadStudyPlan()
        ]);
      } catch (error) {
        console.error('❌ Ошибка инициализации компонента:', error);
        this.loading = false;
      }
    },

    async loadLessons() {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons`);
        this.lessons = Array.isArray(data) ? data : [];
        console.log('📚 Lessons loaded:', this.lessons.length);
        this.processTopics();
      } catch (error) {
        console.error('❌ Ошибка при загрузке уроков:', error.response?.data || error.message);
        this.lessons = [];
        this.processTopics();
      }
    },

    async loadUserProgress() {
      if (!this.userId) return;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        if (!token) return;

        // Use the new dedicated endpoint for topic progress
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/topics-progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('📊 Topic progress loaded:', data);
        this.userProgress = data || {};
        
      } catch (error) {
        console.error('❌ Ошибка при загрузке прогресса:', error.response?.data || error.message);
        // Fallback to calculating locally if the endpoint doesn't exist
        await this.loadUserProgressFallback();
      }
    },

    async loadUserProgressFallback() {
      if (!this.userId) return;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        if (!token) return;

        // Get all user progress data
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/progress`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { userId: this.userId }
          }
        );

        // Process the progress data to calculate topic progress
        const progressData = response.data?.data || response.data || [];
        const topicProgressMap = {};

        // Group lessons by topicId and calculate progress
        const topicLessons = {};
        
        // First, count total lessons per topic from all lessons
        this.lessons.forEach(lesson => {
          if (lesson && lesson.topicId) {
            const topicId = String(lesson.topicId);
            if (!topicLessons[topicId]) {
              topicLessons[topicId] = {
                total: 0,
                completed: 0
              };
            }
            topicLessons[topicId].total++;
          }
        });

        // Then, count completed lessons from progress data
        progressData.forEach(progress => {
          if (progress && progress.lessonId) {
            // Find the lesson to get its topicId
            const lesson = this.lessons.find(l => 
              l && (String(l._id) === String(progress.lessonId._id || progress.lessonId))
            );
            
            if (lesson && lesson.topicId) {
              const topicId = String(lesson.topicId);
              if (topicLessons[topicId] && progress.completed) {
                topicLessons[topicId].completed++;
              }
            }
          }
        });

        // Calculate percentage for each topic
        Object.keys(topicLessons).forEach(topicId => {
          const topic = topicLessons[topicId];
          if (topic.total > 0) {
            topicProgressMap[topicId] = Math.round((topic.completed / topic.total) * 100);
          } else {
            topicProgressMap[topicId] = 0;
          }
        });

        console.log('📊 Topic progress calculated:', topicProgressMap);
        this.userProgress = topicProgressMap;
        
      } catch (error) {
        console.error('❌ Ошибка при загрузке прогресса:', error.response?.data || error.message);
        this.userProgress = {};
      }
    },

    async loadStudyPlan() {
      if (!this.userId) return;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        if (!token) return;

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.studyPlanTopics = (data || []).map(item => {
          if (item && item.topicId) {
            return String(item.topicId);
          }
          return '';
        }).filter(id => id);
        
        console.log('📚 Study plan loaded:', this.studyPlanTopics);
      } catch (error) {
        console.error('❌ Ошибка при загрузке учебного плана:', error.response?.data || error.message);
        this.studyPlanTopics = [];
      }
    },

    // Single processTopics method
    processTopics() {
      try {
        const topicsMap = new Map();
        
        if (!Array.isArray(this.lessons)) {
          this.lessons = [];
        }

        // Group lessons by topic
        this.lessons.forEach(lesson => {
          if (!lesson) return;
          
          const topicId = lesson.topicId ? String(lesson.topicId) : null;
          const name = this.getTopicName(lesson);
          
          if (!topicId || !name) return;

          if (!topicsMap.has(topicId)) {
            topicsMap.set(topicId, {
              topicId,
              name: String(name || ''),
              subject: String(lesson.subject || ''),
              level: String(lesson.level || 'Базовый'),
              type: lesson.type || 'free',
              lessonCount: 1,
              totalTime: 10,
              lessons: [lesson] // Keep track of lessons
            });
          } else {
            const entry = topicsMap.get(topicId);
            if (entry) {
              entry.lessonCount += 1;
              entry.totalTime += 10;
              entry.lessons.push(lesson);
            }
          }
        });

        console.log('📚 Topics grouped:', topicsMap.size);

        // Add progress and study plan info
        this.originalTopics = [...topicsMap.values()].map(topic => {
          if (!topic) return null;
          
          // Calculate progress based on actual lesson completion
          let progress = 0;
          
          // Method 1: Try to get from userProgress object
          if (this.userProgress[topic.topicId]) {
            progress = this.userProgress[topic.topicId];
          } 
          // Method 2: Try by topic name
          else if (this.userProgress[topic.name]) {
            progress = this.userProgress[topic.name];
          }
          // Method 3: Calculate from individual lesson progress if available
          else if (topic.lessons && topic.lessons.length > 0 && this.lessonProgress) {
            let completedLessons = 0;
            topic.lessons.forEach(lesson => {
              // Check if this lesson is completed in lessonProgress
              if (this.lessonProgress[lesson._id]) {
                completedLessons++;
              }
            });
            
            if (topic.lessons.length > 0) {
              progress = Math.round((completedLessons / topic.lessons.length) * 100);
            }
          }
          
          console.log(`📊 Topic "${topic.name}" (${topic.topicId}) - Progress: ${progress}%`);
          
          return {
            ...topic,
            progress: progress,
            inStudyPlan: this.studyPlanTopics.includes(topic.topicId)
          };
        }).filter(topic => topic !== null);

        console.log('✅ Original topics processed:', this.originalTopics.length);
        this.applyFilters();
        this.loading = false;
      } catch (error) {
        console.error('❌ Error processing topics:', error);
        this.originalTopics = [];
        this.groupedTopics = [];
        this.loading = false;
      }
    },

    // Add this new method to load individual lesson progress
    async loadLessonProgress() {
      if (!this.userId) return;
      
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        if (!token) return;

        // Get all user progress records
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/progress`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { userId: this.userId }
          }
        );

        // Create a map of lesson progress
        this.lessonProgress = {};
        const progressData = response.data?.data || response.data || [];
        
        progressData.forEach(progress => {
          if (progress.lessonId) {
            const lessonId = progress.lessonId._id || progress.lessonId;
            this.lessonProgress[lessonId] = progress.completed || false;
          }
        });
        
        console.log('📚 Lesson progress loaded:', Object.keys(this.lessonProgress).length, 'lessons');
        
        // Reprocess topics after loading lesson progress
        this.processTopics();
      } catch (error) {
        console.error('❌ Error loading lesson progress:', error);
        this.lessonProgress = {};
      }
    },

    applyFilters() {
      try {
        const query = String(this.searchQuery || '').toLowerCase();
        
        this.groupedTopics = this.originalTopics.filter(topic => {
          if (!topic) return false;
          
          // Safe string conversion for search
          const topicName = String(topic.name || '').toLowerCase();
          const topicSubject = String(topic.subject || '').toLowerCase();
          
          const matchesSearch = topicName.includes(query) || topicSubject.includes(query);
          
          let matchesFilter = true;
          const progress = topic.progress || 0;
          
          switch (this.filterType) {
            case 'free':
              matchesFilter = topic.type === 'free';
              break;
            case 'premium':
              matchesFilter = topic.type === 'premium';
              break;
            case 'in-progress':
              matchesFilter = progress > 0 && progress < 100;
              break;
            case 'completed':
              matchesFilter = progress === 100;
              break;
            default:
              matchesFilter = true;
          }
          
          return matchesFilter && matchesSearch;
        });
        
        console.log('🔍 Filtered topics:', this.groupedTopics.length);
      } catch (error) {
        console.error('❌ Ошибка при применении фильтров:', error);
        this.groupedTopics = [];
      }
    },

    getTopicName(lesson) {
      if (!lesson) return 'Без темы';
      
      try {
        // Check different possible structures
        if (typeof lesson.topic === 'string') {
          return lesson.topic;
        }
        
        if (lesson.translations && lesson.translations[this.lang] && lesson.translations[this.lang].topic) {
          return String(lesson.translations[this.lang].topic);
        }
        
        if (lesson.topic && typeof lesson.topic === 'object') {
          if (lesson.topic[this.lang]) {
            return String(lesson.topic[this.lang]);
          }
          if (lesson.topic.en) {
            return String(lesson.topic.en);
          }
        }
        
        return 'Без темы';
      } catch (error) {
        console.error('❌ Ошибка при получении названия темы:', error);
        return 'Без темы';
      }
    },

    getLevelClass(level) {
      const levelStr = String(level || '').toLowerCase();
      switch (levelStr) {
        case 'beginner':
        case 'начинающий':
        case 'базовый':
        case '1':
          return 'level-beginner';
        case 'intermediate':
        case 'средний':
        case '2':
          return 'level-intermediate';
        case 'advanced':
        case 'продвинутый':
        case '3':
          return 'level-advanced';
        case 'expert':
        case 'эксперт':
        case '4':
        case '5':
          return 'level-expert';
        default:
          return 'level-beginner';
      }
    },

    getProgressClass(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return 'progress-completed';
      if (prog >= 70) return 'progress-high';
      if (prog >= 30) return 'progress-medium';
      if (prog > 0) return 'progress-low';
      return 'progress-none';
    },

    getProgressColor(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return '#10b981';
      if (prog >= 70) return '#3b82f6';
      if (prog >= 30) return '#f59e0b';
      return '#ef4444';
    },

    getButtonClass(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return 'btn-completed';
      if (prog > 0) return 'btn-continue';
      return 'btn-start';
    },

    getButtonText(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return '✅ Завершен';
      if (prog > 0) return '▶️ Продолжить';
      return '🚀 Начать курс';
    },

    handleAccess(topicId, type) {
      if (!topicId) {
        console.error('❌ Не указан ID темы');
        return;
      }
      
      if (type === 'premium' && !this.isPremiumUser) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
      } else {
        this.$router.push({ name: 'TopicOverview', params: { id: topicId } });
      }
    },

    addToStudyPlan(topic) {
      if (!topic || topic.inStudyPlan) return;
      this.selectedTopic = topic;
      this.showAddModal = true;
    },

    async confirmAddToStudyPlan() {
      if (!this.selectedTopic) {
        this.showAddModal = false;
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Пожалуйста, войдите в аккаунт.');
        this.showAddModal = false;
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const url = `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`;
        const body = {
          subject: this.selectedTopic.subject || '',
          level: this.selectedTopic.level || '',
          topic: this.selectedTopic.name || '',
          topicId: this.selectedTopic.topicId
        };
        
        await axios.post(url, body, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        // Update local state
        this.selectedTopic.inStudyPlan = true;
        if (!this.studyPlanTopics.includes(this.selectedTopic.topicId)) {
          this.studyPlanTopics.push(this.selectedTopic.topicId);
        }
        
        this.showAddModal = false;
        this.showSuccessModal = true;
      } catch (error) {
        console.error('❌ Ошибка при добавлении в план:', error.response?.data || error.message);
        alert('❌ Не удалось добавить тему');
        this.showAddModal = false;
      }
    },

    handlePlanUpdate(newPlan) {
      this.plan = newPlan;
      // You can add additional logic here if needed
    }
  },
  watch: {
    searchQuery: {
      handler() {
        this.applyFilters();
      },
      immediate: false
    },
    filterType: {
      handler() {
        this.applyFilters();
      },
      immediate: false
    }
  }
};
</script>

<style scoped>
/* Professional Black & White Design with Purple/Blue Accents */
.lessons-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #fafafa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4c1d95 0%, #1e40af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.subscription-badge {
  padding: 6px 14px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid;
}

.badge-pro { 
  background: linear-gradient(135deg, #4c1d95 0%, #1e40af 100%); 
  color: white; 
  border-color: #4c1d95;
}
.badge-start { 
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); 
  color: white; 
  border-color: #1e40af;
}
.badge-free { 
  background: #f8fafc; 
  color: #374151; 
  border-color: #d1d5db;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input, .filter-select {
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  color: #374151;
}

.search-input {
  flex: 1;
  min-width: 280px;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #4c1d95;
  box-shadow: 0 0 0 3px rgba(76, 29, 149, 0.1);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  font-size: 1.1rem;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #4c1d95;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.lesson-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
  position: relative;
}

.lesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #4c1d95;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.lesson-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.add-btn {
  background: #ffffff;
  color: #4c1d95;
  border: 2px solid #4c1d95;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-btn:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #d1d5db;
  cursor: not-allowed;
}

.add-btn:hover:not(:disabled) {
  background: #4c1d95;
  color: white;
}

.lesson-topic {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #6b7280;
}

.level-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.level-beginner { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.level-intermediate { background: #fffbeb; color: #92400e; border: 1px solid #fed7aa; }
.level-advanced { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.level-expert { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }

.lesson-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  color: #6b7280;
}

.progress-section {
  margin: 12px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.85rem;
}

.progress-percentage {
  font-weight: 600;
  color: #111827;
  font-size: 0.85rem;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-none { background: #e5e7eb; }
.progress-low { background: #dc2626; }
.progress-medium { background: #d97706; }
.progress-high { background: #1e40af; }
.progress-completed { background: #4c1d95; }

.mini-chart {
  flex-shrink: 0;
}

.pie-chart {
  width: 32px;
  height: 32px;
}

.progress-circle {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  font-size: 7px;
  font-weight: 500;
  fill: #374151;
}

.status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  gap: 8px;
  flex-wrap: wrap;
}

.access-label {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.access-label.free {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.access-label.paid {
  background: linear-gradient(135deg, #4c1d95 0%, #1e40af 100%);
  color: white;
  border-color: #4c1d95;
}

.status-badges {
  display: flex;
  gap: 6px;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid;
}

.status-badge.completed {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.status-badge.in-progress {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.status-badge.not-started {
  background: #f8fafc;
  color: #6b7280;
  border-color: #d1d5db;
}

.start-btn {
  width: 100%;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.btn-start {
  background: linear-gradient(135deg, #4c1d95 0%, #1e40af 100%);
  color: white;
}

.btn-continue {
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
  color: white;
}

.btn-completed {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
}

.btn-start:hover, .btn-continue:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 29, 149, 0.3);
}

.btn-completed:hover {
  transform: none;
  box-shadow: none;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 450px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.2);
  animation: slide-up 0.2s ease;
  position: relative;
  border: 1px solid #e5e7eb;
}

.modal-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 12px 20px 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f3f4f6;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #ef4444;
  color: white;
}

.topic-preview {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.topic-preview h4 {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.topic-preview p {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 0.9rem;
}

.topic-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 0.85rem;
  color: #6b7280;
}

.btn-primary {
  background: linear-gradient(135deg, #4c1d95 0%, #1e40af 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 29, 149, 0.3);
}

.btn-secondary {
  background: #f8fafc;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-secondary:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.success-modal {
  text-align: center;
}

.success-content {
  padding: 32px 20px;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.success-content h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 10px;
  color: #4c1d95;
}

.success-content p {
  color: #6b7280;
  margin: 0 0 20px;
  line-height: 1.5;
  font-size: 0.95rem;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .lessons-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
    padding: 16px 20px;
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .lessons-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .lesson-card {
    padding: 16px;
  }
  
  .card-header {
    gap: 8px;
  }
  
  .lesson-title {
    font-size: 1.1rem;
  }
  
  .add-btn {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }
  
  .progress-bar-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .mini-chart {
    align-self: center;
  }
  
  .status-section {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .modal-content {
    width: 95%;
    max-height: 85vh;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.6rem;
  }
  
  .lesson-card {
    padding: 14px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .add-btn {
    align-self: flex-end;
    width: 26px;
    height: 26px;
    font-size: 0.85rem;
  }
  
  .lesson-stats {
    flex-direction: column;
    gap: 6px;
  }
  
  .progress-section {
    padding: 10px;
  }
  
  .pie-chart {
    width: 28px;
    height: 28px;
  }
  
  .progress-text {
    font-size: 6px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .lessons-page {
    background: #111827;
    color: #f9fafb;
  }
  
  .page-header {
    background: #1f2937;
    border-color: #374151;
  }
  
  .lesson-card {
    background: #1f2937;
    border-color: #374151;
  }
  
  .lesson-card:hover {
    border-color: #8b5cf6;
  }
  
  .lesson-title {
    color: #f9fafb;
  }
  
  .progress-section {
    background: #111827;
    border-color: #374151;
  }
  
  .search-input,
  .filter-select {
    background: #1f2937;
    color: #f9fafb;
    border-color: #374151;
  }
  
  .search-input:focus,
  .filter-select:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  .modal-content {
    background: #1f2937;
    color: #f9fafb;
    border-color: #374151;
  }
  
  .modal-header {
    border-color: #374151;
  }
  
  .topic-preview {
    background: #111827;
    border-color: #374151;
  }
  
  .modal-close {
    background: #374151;
    color: #9ca3af;
  }
  
  .btn-secondary {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
}

/* Print Styles */
@media print {
  .lessons-page {
    background: white;
    color: black;
  }
  
  .lesson-card {
    background: white;
    box-shadow: none;
    border: 1px solid #ccc;
    break-inside: avoid;
    margin-bottom: 16px;
  }
  
  .add-btn,
  .start-btn {
    display: none;
  }
  
  .progress-section {
    background: #f5f5f5;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .lesson-card:hover {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}
</style>