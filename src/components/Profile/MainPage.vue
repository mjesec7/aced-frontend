<template>
  <div class="dashboard">
    <h1 class="title">👋 Добро пожаловать обратно!</h1>
    <!-- Professional Filter Bar -->
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
          <button v-if="hasActiveFilters" @click="clearFilters" class="clear-all-btn">
            🗑️ Очистить
          </button>
          <span class="user-badge" :class="userStatus">{{ userStatusLabel }}</span>
        </div>
      </div>
      
      <!-- Active Filters Tags -->
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

    <!-- Error Alert -->
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

    <!-- 🌟 Recommendations Carousel -->
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
              <!-- Topic Type Badge -->
              <div class="topic-badge" :class="getTopicType(topic)">
                <span class="badge-text">{{ getTopicTypeLabel(topic) }}</span>
              </div>

              <!-- Topic Content -->
              <div class="topic-content">
                <h3 class="topic-title">{{ getTopicName(topic) }}</h3>
                <p class="topic-desc">{{ getTopicDescription(topic) }}</p>
                
                <!-- Topic Stats -->
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
                
                <!-- Subject Tag -->
                <div class="subject-info">
                  <span class="subject-tag">{{ topic.subject || 'Общий' }}</span>
                </div>
              </div>

              <!-- Card Actions -->
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
        <button v-else-if="filterType || filterSubject || searchQuery" class="clear-filters-btn" @click="clearFilters">
          🗑️ Очистить фильтры
        </button>
      </div>
    </div>

    <!-- 📚 Study List -->
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
          <button v-if="filterType || filterSubject || searchQuery" class="clear-filters-btn" @click="clearFilters">
            🗑️ Очистить фильтры
          </button>
          <router-link to="/profile/catalogue" class="browse-link">
            📚 Просмотреть каталог курсов
          </router-link>
        </div>
      </div>
    </div>

    <!-- 💳 Payment Modal -->
    <PaymentModal
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="userStatus = $event"
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
import { auth } from '@/firebase';
import StudyCard from '@/components/Profile/StudyCard.vue';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'MainPage',
  components: { StudyCard, PaymentModal },
  data() {
    return {
      userId: null,
      allRecommendations: [], // All available recommendations
      displayedRecommendations: [], // Currently displayed 10 random ones
      studyList: [],
      allSubjects: [],
      allLevels: [],
      loadingRecommendations: true,
      loadingStudyList: true,
      
      // Carousel state
      isAtStart: true,
      isAtEnd: false,
      
      // Enhanced Filters
      searchQuery: '',
      filterSubject: '',
      filterLevel: '',
      filterType: '',
      filterProgress: '',
      sortBy: 'name',
      
      showPaywall: false,
      requestedTopicId: null,
      lang: localStorage.getItem('lang') || 'en',
      // Error handling state
      errors: {
        recommendations: null,
        studyList: null
      },
      retryCount: 0,
      maxRetries: 3,
      invalidTopicsCleanedUp: 0
    };
  },
  computed: {
    ...mapGetters('user', ['userStatus']),
    
    filteredRecommendations() {
      return this.applySorting(this.displayedRecommendations
        .filter(t => t.lessons?.length)
        .filter(t => {
          const name = this.getTopicName(t);
          const description = this.getTopicDescription(t);
          const topicType = this.getTopicType(t);
          
          return (
            (!this.filterSubject || t.subject === this.filterSubject) &&
            (!this.filterLevel || t.level?.toString() === this.filterLevel?.toString()) &&
            (!this.filterType || topicType === this.filterType) &&
            (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             description.toLowerCase().includes(this.searchQuery.toLowerCase()))
          );
        }));
    },
    
    filteredStudyList() {
      return this.applySorting(this.studyList.filter(t => {
        const name = this.getTopicName(t);
        const description = this.getTopicDescription(t);
        const topicType = this.getTopicType(t);
        const progress = t.progress?.percent || 0;
        
        // Progress filter logic
        let matchesProgress = true;
        if (this.filterProgress) {
          switch (this.filterProgress) {
            case 'not-started':
              matchesProgress = progress === 0;
              break;
            case 'in-progress':
              matchesProgress = progress > 0 && progress < 100;
              break;
            case 'completed':
              matchesProgress = progress === 100;
              break;
          }
        }
        
        return (
          (!this.filterSubject || t.subject === this.filterSubject) &&
          (!this.filterLevel || t.level?.toString() === this.filterLevel?.toString()) &&
          (!this.filterType || topicType === this.filterType) &&
          matchesProgress &&
          (name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
           description.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      }));
    },
    
    userStatusLabel() {
      if (this.userStatus === 'pro') return 'Pro';
      if (this.userStatus === 'start') return 'Start';
      return 'Free';
    },
    
    hasErrors() {
      return this.errors.recommendations || this.errors.studyList;
    },
    
    hasActiveFilters() {
      return this.searchQuery || this.filterSubject || this.filterLevel || 
             this.filterType || this.filterProgress;
    }
  },
  async mounted() {
    const storedId = this.$store.state.firebaseUserId || localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
    if (!storedId) {
      return this.$router.push('/');
    }
    this.userId = storedId;
    
    // Load in parallel but handle errors independently
    await Promise.allSettled([
      this.fetchRecommendations(),
      this.fetchStudyList()
    ]);
  },
  methods: {
    // ✅ ENHANCED: Topic type detection methods
    getTopicType(topic) {
      const type = topic.type || topic.accessType || topic.pricing || topic.plan;
      
      if (!type || type === 'free' || type === 'public') return 'free';
      if (type === 'premium' || type === 'paid' || type === 'start') return 'premium';
      if (type === 'pro' || type === 'professional') return 'pro';
      
      return 'free';
    },
    
    getTopicTypeClass(topic) {
      return `topic-${this.getTopicType(topic)}`;
    },
    
    getTopicTypeIcon(topic) {
      const type = this.getTopicType(topic);
      switch (type) {
        case 'free': return '💚';
        case 'premium': return '💎';
        case 'pro': return '🌟';
        default: return '💚';
      }
    },
    
    getTopicTypeLabel(topic) {
      const type = this.getTopicType(topic);
      switch (type) {
        case 'free': return 'Бесплатно';
        case 'premium': return 'Премиум';
        case 'pro': return 'Pro';
        default: return 'Бесплатно';
      }
    },
    
    // ✅ ENHANCED: Access status methods
    getAccessStatus(topic) {
      const topicType = this.getTopicType(topic);
      const hasAccess = this.hasTopicAccess(topic);
      
      if (hasAccess) return 'accessible';
      if (topicType === 'free') return 'accessible';
      return 'restricted';
    },
    
    hasTopicAccess(topic) {
      const topicType = this.getTopicType(topic);
      
      if (topicType === 'free') return true;
      if (topicType === 'premium' && (this.userStatus === 'start' || this.userStatus === 'pro')) return true;
      if (topicType === 'pro' && this.userStatus === 'pro') return true;
      
      return false;
    },
    
    // ✅ ENHANCED: Button state methods
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
      if (!this.hasTopicAccess(topic)) return '🔒';
      return '🚀';
    },
    
    getStartButtonText(topic) {
      if (!this.hasTopicAccess(topic)) {
        const topicType = this.getTopicType(topic);
        return topicType === 'pro' ? 'Нужен Pro' : 'Нужен Start';
      }
      return 'Начать';
    },
    
    getStartButtonTitle(topic) {
      const topicType = this.getTopicType(topic);
      const hasAccess = this.hasTopicAccess(topic);
      
      if (!hasAccess) {
        return `Этот курс требует подписку ${this.getTopicTypeLabel(topic)}`;
      }
      
      return `Начать изучение курса "${this.getTopicName(topic)}"`;
    },
    
    // ✅ Enhanced filter methods
    clearFilters() {
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
      this.filterType = '';
      this.filterProgress = '';
      this.sortBy = 'name';
    },
    
    getTopicName(topic) {
      return topic.name?.[this.lang] || topic.name?.en || topic.name || topic.topicName || 'Без названия';
    },
    
    getTopicDescription(topic) {
      return topic.description?.[this.lang] || topic.description?.en || topic.description || topic.topicDescription || 'Описание отсутствует';
    },

    // Enhanced error handling method
    handleApiError(error, context) {
      console.error(`❌ API Error [${context}]:`, error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 404:
            errorMessage = 'Resource not found. It may have been deleted.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            setTimeout(() => this.$router.push('/'), 2000);
            return { message: errorMessage, shouldRedirect: true };
          case 403:
            errorMessage = 'Access denied. You may not have permission.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data?.message || `Server error (${status})`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || 'Something went wrong';
      }
      
      return { message: errorMessage, originalError: error };
    },

    // ✅ FIXED: Get recommendations using CataloguePage logic
    async fetchRecommendations() {
      try {
        this.loadingRecommendations = true;
        this.errors.recommendations = null;
        
        console.log('🔍 Fetching recommendations using CataloguePage logic...');
        
        // ✅ STRATEGY: Build recommendations from lessons (same as CataloguePage)
        const lessonsResult = await getAllLessons();
        if (lessonsResult.success && lessonsResult.data.length > 0) {
          const allLessons = lessonsResult.data;
          console.log(`📚 Got ${allLessons.length} lessons for building recommendations`);
          
          // ✅ Group lessons by topicId and build topic objects (exact CataloguePage logic)
          const topicsMap = new Map();
          
          allLessons.forEach(lesson => {
            if (!lesson || !lesson.topicId) return;
            
            let topicId = lesson.topicId;
            if (typeof topicId === 'object' && topicId !== null) {
              topicId = topicId._id || topicId.id || String(topicId);
            } else if (topicId) {
              topicId = String(topicId);
            } else {
              return;
            }
            
            const topicName = this.getTopicNameFromLesson(lesson);
            if (!topicId || !topicName) return;

            if (!topicsMap.has(topicId)) {
              topicsMap.set(topicId, {
                _id: topicId,
                id: topicId,
                name: topicName,
                topicName: topicName,
                description: `Курс по теме "${topicName}" содержит уроков`,
                topicDescription: `Изучите ${topicName} с практическими упражнениями`,
                subject: lesson.subject || 'General',
                level: lesson.level || 1,
                type: lesson.type || 'free',
                lessons: [lesson],
                lessonCount: 1,
                totalTime: 10,
                isActive: true,
                hasLessons: true,
                createdAt: lesson.createdAt || new Date().toISOString(),
                updatedAt: lesson.updatedAt || new Date().toISOString(),
                metadata: {
                  source: 'built-from-lessons',
                  constructedAt: new Date().toISOString()
                }
              });
            } else {
              const topic = topicsMap.get(topicId);
              topic.lessons.push(lesson);
              topic.lessonCount++;
              topic.totalTime += 10;
              
              // Update description with lesson count
              topic.description = `Курс по теме "${topicName}" содержит ${topic.lessonCount} уроков`;
            }
          });
          
          // ✅ Convert to array and filter (only topics with lessons)
          const builtTopics = Array.from(topicsMap.values())
            .filter(topic => topic.lessons.length > 0)
            .map(topic => ({
              ...topic,
              // Calculate difficulty based on level
              difficulty: topic.level <= 3 ? 2 : topic.level <= 6 ? 3 : 4,
              // Ensure we have proper structure
              hasFreeLessons: topic.lessons.some(l => l.type === 'free'),
              hasPremiumLessons: topic.lessons.some(l => l.type === 'premium'),
            }))
            .sort((a, b) => {
              // Sort by subject first, then by level
              if (a.subject !== b.subject) {
                return a.subject.localeCompare(b.subject);
              }
              return (a.level || 0) - (b.level || 0);
            });
          
                      console.log(`✅ Built ${builtTopics.length} topic recommendations from lessons`);
          
          // ✅ Store all recommendations and select random 10 for display
          this.allRecommendations = builtTopics;
          this.displayedRecommendations = this.getRandomRecommendations(10);
          this.extractSubjects(this.allRecommendations);
          
          console.log(`📊 Total available: ${this.allRecommendations.length}, Displaying: ${this.displayedRecommendations.length}`);
          return;
        }
        
        // ✅ Fallback: Try to get topics directly
        console.log('🔄 Fallback: Trying to get topics directly...');
        const topicsResult = await getTopics({ includeStats: true });
        
        if (topicsResult.success && topicsResult.data.length > 0) {
          console.log(`📚 Found ${topicsResult.data.length} topics directly`);
          
          // Get lessons for each topic to build complete topic data
          const topicsWithLessons = await Promise.allSettled(
            topicsResult.data.slice(0, 20).map(async (topic) => {
              try {
                const lessonsResult = await getLessonsByTopic(topic._id);
                
                if (lessonsResult.success && lessonsResult.data.length > 0) {
                  return {
                    ...topic,
                    lessons: lessonsResult.data,
                    lessonCount: lessonsResult.data.length,
                    totalTime: lessonsResult.data.length * 10,
                    hasLessons: true
                  };
                }
                return null;
              } catch (error) {
                console.warn(`⚠️ Failed to get lessons for topic ${topic._id}:`, error.message);
                return null;
              }
            })
          );
          
          const validTopics = topicsWithLessons
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
          
          if (validTopics.length > 0) {
            this.allRecommendations = validTopics;
            this.displayedRecommendations = this.getRandomRecommendations(10);
            this.extractSubjects(this.allRecommendations);
            console.log(`✅ Successfully loaded ${this.allRecommendations.length} total recommendations, displaying ${this.displayedRecommendations.length}`);
            return;
          }
        }
        
        // No data available
        console.log('ℹ️ No topics or lessons available for recommendations');
        this.allRecommendations = [];
        this.displayedRecommendations = [];
        
      } catch (err) {
        const errorInfo = this.handleApiError(err, 'fetch-recommendations');
        this.errors.recommendations = errorInfo.message;
        this.allRecommendations = [];
        this.displayedRecommendations = [];
        
        if (err.response?.status === 404) {
          this.errors.recommendations = null;
        }
        
        console.error('❌ Failed to fetch recommendations:', err);
      } finally {
        this.loadingRecommendations = false;
        
        // Update carousel position after loading
        this.$nextTick(() => {
          this.updateScrollPosition();
        });
      }
    },

    // ✅ COMPLETELY FIXED: Fetch study list using proper API methods
    async fetchStudyList() {
      try {
        this.loadingStudyList = true;
        this.errors.studyList = null;
        this.invalidTopicsCleanedUp = 0;
        
        console.log('🔍 Fetching study list...');
        
        // Get user's study list
        const studyListResult = await getUserStudyList(this.userId);
        
        if (!studyListResult.success || !Array.isArray(studyListResult.data) || studyListResult.data.length === 0) {
          console.log('ℹ️ No study list entries found');
          this.studyList = [];
          return;
        }
        
        console.log(`📚 Found ${studyListResult.data.length} study list entries`);
        
        // Get user progress for calculating completion
        let userProgressData = [];
        try {
          const progressResult = await getUserProgress(this.userId);
          if (progressResult.success) {
            userProgressData = progressResult.data || [];
            console.log(`📊 Loaded ${userProgressData.length} progress records`);
          }
        } catch (progressError) {
          console.warn('⚠️ Failed to load progress data:', progressError.message);
        }
        
        // Process each study list entry to build complete topic data
        const validTopics = [];
        
        const topicPromises = studyListResult.data.map(async (entry) => {
          if (!entry.topicId) {
            console.warn('⚠️ Study list entry missing topicId:', entry);
            return null;
          }
          
          try {
            console.log(`🔍 Processing topic: ${entry.topicId}`);
            
            // ✅ Strategy 1: Try to get the topic directly
            let topicData = null;
            try {
              const topicResult = await getTopicById(entry.topicId);
              if (topicResult.success && topicResult.data) {
                topicData = topicResult.data;
                console.log(`✅ Got topic data: ${topicData.name || topicData.topicName}`);
              }
            } catch (topicError) {
              console.warn(`⚠️ Failed to get topic ${entry.topicId} directly:`, topicError.message);
            }
            
            // ✅ Strategy 2: Get lessons for this topic
            let lessons = [];
            try {
              const lessonsResult = await getLessonsByTopic(entry.topicId);
              if (lessonsResult.success && Array.isArray(lessonsResult.data)) {
                lessons = lessonsResult.data;
                console.log(`📚 Got ${lessons.length} lessons for topic ${entry.topicId}`);
              }
            } catch (lessonsError) {
              console.warn(`⚠️ Failed to get lessons for topic ${entry.topicId}:`, lessonsError.message);
            }
            
            // If no topic data and no lessons, skip this entry
            if (!topicData && lessons.length === 0) {
              console.warn(`⚠️ No data found for topic ${entry.topicId}, skipping`);
              this.invalidTopicsCleanedUp++;
              return null;
            }
            
            // ✅ Build/enhance topic data
            if (!topicData && lessons.length > 0) {
              // Build topic from lessons (like CataloguePage does)
              const firstLesson = lessons[0];
              topicData = {
                _id: entry.topicId,
                id: entry.topicId,
                name: this.getTopicNameFromLesson(firstLesson),
                topicName: this.getTopicNameFromLesson(firstLesson),
                description: `Курс по теме "${this.getTopicNameFromLesson(firstLesson)}" содержит ${lessons.length} уроков`,
                subject: firstLesson.subject || 'General',
                level: firstLesson.level || 1,
                type: firstLesson.type || 'free',
                isActive: true,
                metadata: {
                  source: 'constructed-from-lessons',
                  constructedAt: new Date().toISOString()
                }
              };
              console.log(`🏗️ Built topic data from lessons: ${topicData.name}`);
            }
            
            // ✅ Calculate progress from user progress data
            let completedLessons = 0;
            let totalStars = 0;
            let totalPoints = 0;
            
            lessons.forEach(lesson => {
              const progress = userProgressData.find(p => {
                const progressLessonId = p.lessonId?._id || p.lessonId;
                return progressLessonId?.toString() === lesson._id?.toString();
              });
              
              if (progress && progress.completed) {
                completedLessons++;
                totalStars += progress.stars || 0;
                totalPoints += progress.points || 0;
              }
            });
            
            const progressPercent = lessons.length > 0 
              ? Math.round((completedLessons / lessons.length) * 100)
              : 0;
            
            let medal = 'none';
            if (progressPercent === 100 && lessons.length > 0) {
              const avgStars = totalStars / lessons.length;
              if (avgStars >= 2.5) medal = 'gold';
              else if (avgStars >= 1.5) medal = 'silver';
              else medal = 'bronze';
            }
            
            // ✅ Build final topic object
            const finalTopic = {
              ...topicData,
              lessons: lessons,
              lessonCount: lessons.length,
              totalTime: lessons.length * 10, // 10 min per lesson estimate
              progress: {
                percent: progressPercent,
                medal: medal,
                completedLessons: completedLessons,
                totalLessons: lessons.length,
                stars: totalStars,
                points: totalPoints
              },
              hasLessons: lessons.length > 0,
              // Preserve original study list entry data
              studyListEntry: entry
            };
            
            console.log(`✅ Built complete topic: ${finalTopic.name} (${finalTopic.progress.percent}% complete)`);
            return finalTopic;
            
          } catch (error) {
            console.error(`❌ Error processing topic ${entry.topicId}:`, error);
            this.invalidTopicsCleanedUp++;
            return null;
          }
        });
        
        // Wait for all topic processing to complete
        const results = await Promise.allSettled(topicPromises);
        
        // Collect valid topics
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            validTopics.push(result.value);
          }
        });
        
        this.studyList = validTopics;
        this.extractSubjects(this.studyList);
        
        console.log(`✅ Successfully loaded ${validTopics.length} study list topics`);
        if (this.invalidTopicsCleanedUp > 0) {
          console.log(`🧹 Cleaned up ${this.invalidTopicsCleanedUp} invalid topic entries`);
        }
        
      } catch (err) {
        const errorInfo = this.handleApiError(err, 'fetch-study-list');
        this.errors.studyList = errorInfo.message;
        this.studyList = [];
        console.error('❌ Critical error in fetchStudyList:', err);
      } finally {
        this.loadingStudyList = false;
      }
    },

    // ✅ Helper method to extract topic name from lesson (same as CataloguePage)
    getTopicNameFromLesson(lesson) {
      if (!lesson) return 'Без темы';
      
      try {
        // Check various possible fields for topic name
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
        
        // Fallback to lessonName or other fields
        if (lesson.lessonName) {
          return `Topic: ${lesson.lessonName}`;
        }
        
        return 'Без темы';
      } catch (error) {
        console.error('❌ Error getting topic name from lesson:', error);
        return 'Без темы';
      }
    },

    extractSubjects(items) {
      const subjects = new Set(items.map(item => item.subject).filter(Boolean));
      this.allSubjects = Array.from(subjects);
      
      const levels = new Set(items.map(item => item.level).filter(Boolean));
      this.allLevels = Array.from(levels).sort((a, b) => Number(a) - Number(b));
    },
    
    // ✅ NEW: Random selection and carousel methods
    getRandomRecommendations(count = 10) {
      if (this.allRecommendations.length <= count) {
        return [...this.allRecommendations];
      }
      
      const shuffled = [...this.allRecommendations].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
    
    shuffleRecommendations() {
      if (this.allRecommendations.length === 0) {
        this.fetchRecommendations();
        return;
      }
      
      this.displayedRecommendations = this.getRandomRecommendations(10);
      
      // Reset carousel position
      this.$nextTick(() => {
        if (this.$refs.carouselContainer) {
          this.$refs.carouselContainer.scrollLeft = 0;
          this.updateScrollPosition();
        }
      });
      
      console.log(`🎲 Shuffled to ${this.displayedRecommendations.length} new recommendations`);
    },
    
    scrollCarousel(direction) {
      const container = this.$refs.carouselContainer;
      if (!container) return;
      
      const scrollAmount = 320; // Card width + gap
      const currentScroll = container.scrollLeft;
      
      if (direction === 'left') {
        container.scrollTo({
          left: currentScroll - scrollAmount,
          behavior: 'smooth'
        });
      } else {
        container.scrollTo({
          left: currentScroll + scrollAmount,
          behavior: 'smooth'
        });
      }
    },
    
    updateScrollPosition() {
      const container = this.$refs.carouselContainer;
      if (!container) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      this.isAtStart = scrollLeft <= 10;
      this.isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
    },
    
    // ✅ NEW: Sorting functionality
    applySorting(items) {
      const sorted = [...items];
      
      switch (this.sortBy) {
        case 'name':
          return sorted.sort((a, b) => this.getTopicName(a).localeCompare(this.getTopicName(b)));
        
        case 'progress':
          return sorted.sort((a, b) => (b.progress?.percent || 0) - (a.progress?.percent || 0));
        
        case 'recent':
          return sorted.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.studyListEntry?.createdAt || 0);
            const bDate = new Date(b.createdAt || b.studyListEntry?.createdAt || 0);
            return bDate - aDate;
          });
        
        case 'subject':
          return sorted.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
        
        case 'level':
          return sorted.sort((a, b) => (a.level || 0) - (b.level || 0));
        
        default:
          return sorted;
      }
    },
    
    // ✅ NEW: Filter label helpers
    getLevelLabel(level) {
      if (!level) return '';
      return `Уровень ${level}`;
    },
    
    getTypeIcon(type) {
      switch (type) {
        case 'free': return '💚';
        case 'premium': return '💎';
        case 'pro': return '🌟';
        default: return '';
      }
    },
    
    getTypeLabel(type) {
      switch (type) {
        case 'free': return 'Бесплатные';
        case 'premium': return 'Премиум';
        case 'pro': return 'Pro';
        default: return '';
      }
    },
    
    getProgressIcon(progress) {
      switch (progress) {
        case 'not-started': return '⭕';
        case 'in-progress': return '🔄';
        case 'completed': return '✅';
        default: return '';
      }
    },
    
    getProgressLabel(progress) {
      switch (progress) {
        case 'not-started': return 'Не начато';
        case 'in-progress': return 'В процессе';
        case 'completed': return 'Завершено';
        default: return '';
      }
    },

    async refreshRecommendations() {
      await this.fetchRecommendations();
    },

    async retryAll() {
      if (this.retryCount >= this.maxRetries) {
        console.warn('⚠️ Max retries reached');
        return;
      }
      
      this.retryCount++;
      
      await Promise.allSettled([
        this.errors.recommendations ? this.fetchRecommendations() : Promise.resolve(),
        this.errors.studyList ? this.fetchStudyList() : Promise.resolve()
      ]);
    },

    async handleAddTopic(topic) {
      try {
        if (!topic || !topic._id) {
          console.error('❌ Invalid topic data for adding');
          return;
        }
        
        console.log('➕ Adding topic to study list:', topic.name || topic.topicName);
        
        // ✅ FIXED: Use proper topic data structure for API
        const topicData = {
          subject: topic.subject || 'General',
          level: topic.level || 1,
          topic: this.getTopicName(topic),
          topicId: topic._id,
          lessonCount: topic.lessonCount || topic.lessons?.length || 0,
          totalTime: topic.totalTime || (topic.lessons?.length * 10) || 10,
          type: topic.type || 'free'
        };
        
        console.log('📦 Sending topic data:', topicData);
        
        const result = await addToStudyList(this.userId, topicData);
        
        if (result.success) {
          // Refresh study list to show the new addition
          await this.fetchStudyList();
          
          // Remove from both recommendation arrays
          this.allRecommendations = this.allRecommendations.filter(t => t._id !== topic._id);
          this.displayedRecommendations = this.displayedRecommendations.filter(t => t._id !== topic._id);
          
          // If we have less than 3 displayed recommendations, get more
          if (this.displayedRecommendations.length < 3 && this.allRecommendations.length > this.displayedRecommendations.length) {
            const needed = Math.min(3, this.allRecommendations.length - this.displayedRecommendations.length);
            const available = this.allRecommendations.filter(t => 
              !this.displayedRecommendations.some(d => d._id === t._id)
            );
            const additional = available.slice(0, needed);
            this.displayedRecommendations.push(...additional);
          }
          
          console.log('✅ Topic added successfully');
        } else {
          throw new Error(result.error || 'Failed to add topic');
        }
        
      } catch (err) {
        console.error('❌ Add topic error:', err);
        
        // ✅ ENHANCED: Better error messages
        let errorMessage = 'Не удалось добавить курс';
        
        if (err.response?.status === 400) {
          const errorData = err.response.data;
          if (errorData.error?.includes('already exists') || errorData.message?.includes('duplicate')) {
            errorMessage = 'Этот курс уже добавлен в ваш список';
          } else if (errorData.error?.includes('validation') || errorData.message?.includes('validation')) {
            errorMessage = 'Некорректные данные курса';
          } else {
            errorMessage = errorData.error || errorData.message || 'Ошибка валидации данных';
          }
        } else if (err.response?.status === 401) {
          errorMessage = 'Необходимо войти в аккаунт';
        } else if (err.response?.status === 403) {
          errorMessage = 'Недостаточно прав доступа';
        } else if (err.response?.status === 409) {
          errorMessage = 'Курс уже добавлен в список';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже';
        }
        
        alert(errorMessage);
      }
    },

    handleStartTopic(topic) {
      if (!topic._id) {
        console.warn('⚠️ Cannot start topic without ID');
        return;
      }
      
      const topicType = this.getTopicType(topic);
      const hasAccess = this.hasTopicAccess(topic);
      
      if (!hasAccess) {
        this.requestedTopicId = topic._id;
        this.showPaywall = true;
      } else {
        this.$router.push({ path: `/topic/${topic._id}/overview` });
      }
    },

    async removeStudyCard(id) {
      try {
        console.log('🗑️ Removing study card:', id);
        
        // Remove from local state first for immediate UI update
        this.studyList = this.studyList.filter(topic => topic._id !== id);
        
        // Try to remove from backend
        try {
          const result = await removeFromStudyList(this.userId, id);
          if (result.success) {
            console.log('✅ Successfully removed from backend');
          } else {
            console.warn('⚠️ Backend removal failed, but UI updated');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend removal failed:', backendError.message);
          // UI is already updated, so we continue
        }
        
      } catch (error) {
        console.error('❌ Error removing study card:', error);
        // If there's an error, refresh the study list to ensure consistency
        await this.fetchStudyList();
      }
    }
  }
};
</script>

<style scoped>
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
   🎠 RECOMMENDATIONS CAROUSEL - FIXED LAYOUT
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
  gap: 24px;
  padding: 0 8px;
}

.recommendation-card {
  flex: 0 0 320px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #1a1a1a;
  height: 420px;
  position: relative;
  overflow: hidden;
}

.recommendation-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.6), 0 16px 48px rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.05), #ffffff);
}

.loading-carousel {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding: 8px;
}

.loading-carousel .recommendation-placeholder {
  flex: 0 0 320px;
  height: 420px;
  background: #f9fafb;
  border: 1px solid #1a1a1a;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
}

.carousel-nav {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
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
   🏷️ TOPIC BADGE - FIXED POSITIONING
======================================== */
.topic-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.topic-badge.free {
  background: #ffffff;
  color: #374151;
  border: 2px solid #374151;
}

.topic-badge.premium {
  background: #8b5cf6;
  color: #ffffff;
  border: 2px solid #8b5cf6;
}

.topic-badge.pro {
  background: #1f2937;
  color: #ffffff;
  border: 2px solid #1f2937;
}

/* ========================================
   📝 TOPIC CONTENT - FIXED LAYOUT
======================================== */
.topic-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 60px; /* Space for badge */
}

.topic-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 3.2rem;
}

.topic-desc {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.topic-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.stat-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.subject-info {
  margin-bottom: 20px;
}

.subject-tag {
  display: inline-block;
  background: #f3f4f6;
  color: #374151;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

/* ========================================
   🔘 CARD ACTIONS - FIXED BUTTON LAYOUT
======================================== */
.card-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  flex-shrink: 0;
}

.add-btn,
.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  min-height: 48px;
}

.add-btn {
  flex: 0 0 auto;
  min-width: 120px;
  background: #f8fafc;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.add-btn:hover:not(:disabled) {
  background: #8b5cf6;
  color: #ffffff;
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

.add-btn:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
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
  font-size: 1rem;
  font-weight: bold;
}

.add-text,
.start-text {
  font-size: 0.85rem;
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
   🃏 GRID & CARDS - COMPACT DESIGN
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
   📱 RESPONSIVE DESIGN
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
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }
  
  .recommendation-card {
    flex: 0 0 300px;
    height: 400px;
  }
  
  .topic-content {
    padding: 20px;
    padding-top: 55px;
  }
  
  .topic-title {
    font-size: 1.1rem;
  }
  
  .card-actions {
    gap: 10px;
  }
  
  .add-btn,
  .start-btn {
    padding: 12px 14px;
    font-size: 0.85rem;
    min-height: 44px;
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
    flex: 0 0 280px;
    height: 380px;
  }
  
  .topic-content {
    padding: 16px;
    padding-top: 50px;
  }
  
  .topic-title {
    font-size: 1rem;
    min-height: 2.8rem;
  }
  
  .topic-desc {
    font-size: 0.8rem;
    margin-bottom: 16px;
  }
  
  .topic-stats {
    margin-bottom: 12px;
    padding: 8px 0;
  }
  
  .stat-value {
    font-size: 0.8rem;
  }
  
  .subject-tag {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
  
  .card-actions {
    gap: 8px;
  }
  
  .add-btn,
  .start-btn {
    padding: 10px 12px;
    font-size: 0.8rem;
    min-height: 40px;
  }
  
  .add-btn {
    min-width: 100px;
  }
  
  .carousel-track {
    gap: 16px;
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
  
  .empty-state {
    padding: 40px 16px;
  }
  
  .empty-icon {
    font-size: 2.5rem;
  }
  
  .empty-state h3 {
    font-size: 1.1rem;
  }
  
  /* ✅ FIXED: Keep recommendation card buttons on same line on mobile */
  .recommendation-card .card-actions {
    flex-direction: row !important;
    gap: 8px;
    padding: 0 16px 16px 16px;
  }
  
  .recommendation-card .add-btn,
  .recommendation-card .start-btn {
    flex: 1;
    padding: 10px 8px;
    font-size: 0.75rem;
    min-width: 0;
  }
  
  .recommendation-card .add-text,
  .recommendation-card .start-text {
    font-size: 0.7rem;
  }
  
  .recommendation-card .topic-content {
    padding: 16px;
  }
  
  .recommendation-card .topic-title {
    font-size: 1rem;
    margin-bottom: 8px;
  }
  
  .recommendation-card .topic-desc {
    font-size: 0.8rem;
    margin-bottom: 16px;
  }
  
  .recommendation-card .topic-stats {
    margin-bottom: 12px;
    padding: 8px 0;
  }
  
  .recommendation-card .stat-value {
    font-size: 0.8rem;
  }
  
  .recommendation-card .subject-tag {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
}

/* Clean type indicators - REMOVED */
</style>