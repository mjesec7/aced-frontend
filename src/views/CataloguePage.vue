<template>
  <div class="catalogue-page">
    <div class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <button
            v-if="currentView !== 'subjects'"
            @click="goBack"
            class="back-btn"
          >
            ← Назад
          </button>
          <div class="breadcrumb-path">
            <span class="breadcrumb-item" :class="{ active: currentView === 'subjects' }">
              Предметы
            </span>
            <span v-if="selectedSubject" class="breadcrumb-separator">›</span>
            <span
              v-if="selectedSubject"
              class="breadcrumb-item"
              :class="{ active: currentView === 'levels' }"
            >
              {{ selectedSubject }}
            </span>
            <span v-if="selectedLevel" class="breadcrumb-separator">›</span>
            <span
              v-if="selectedLevel"
              class="breadcrumb-item"
              :class="{ active: currentView === 'topics' }"
            >
              {{ selectedLevel }}
            </span>
          </div>
        </div>

        <span class="subscription-badge" :class="subscriptionClass">
          {{ subscriptionText }}
        </span>
      </div>

      <h1 class="page-title">
        <span v-if="currentView === 'subjects'">Каталог Предметов</span>
        <span v-else-if="currentView === 'levels'">Выберите Уровень</span>
        <span v-else>Темы для Изучения</span>
      </h1>
    </div>

    <div class="main-content">
      <div class="filter-bar">
        <div class="filter-row">
          <div class="filter-item">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="🔍 Поиск..."
            />
          </div>

          <div v-if="currentView !== 'subjects'" class="filter-item">
            <select v-model="filterSubject" class="filter-select">
              <option value="">Все предметы</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div v-if="currentView === 'topics'" class="filter-item">
            <select v-model="filterLevel" class="filter-select">
              <option value="">Все уровни</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
          </div>

          <div class="filter-item checkbox-filter">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showFree" />
              🆓 Бесплатные
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="showPremium" />
              ⭐ Премиум
            </label>
          </div>

          <div v-if="currentView === 'topics'" class="filter-item checkbox-filter">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showNotStarted" />
              ⭕ Не начато
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="showInProgress" />
              🔄 В процессе
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="showCompleted" />
              ✅ Завершено
            </label>
          </div>

          <button @click="clearFilters" class="clear-btn">Очистить</button>
        </div>
      </div>

      <div class="content-area">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <span>Загрузка...</span>
        </div>

        <div v-else-if="currentView === 'subjects'" class="subjects-grid">
          <div
            v-for="subject in filteredSubjects"
            :key="subject.name"
            @click="selectSubject(subject.name)"
            class="subject-card"
          >
            <div class="card-icon">{{ subject.icon }}</div>
            <h3 class="card-title">{{ subject.name }}</h3>
            <div class="card-stats">
              <span class="stat-badge">{{ subject.topicCount }} тем</span>
              <span class="stat-badge">{{ subject.lessonCount }} уроков</span>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'levels'" class="levels-grid">
          <div
            v-for="level in filteredLevels"
            :key="level.name"
            @click="selectLevel(level.name)"
            class="level-card"
          >
            <div class="level-header">
              <div class="level-icon" :class="getLevelClass(level.name)">
                {{ getLevelIcon(level.name) }}
              </div>
              <h3 class="card-title">{{ level.name }}</h3>
            </div>
            <p class="level-description">{{ getLevelDescription(level.name) }}</p>
            <div class="card-stats">
              <span class="stat-badge">{{ level.topicCount }} тем</span>
              <span class="stat-badge">{{ level.lessonCount }} уроков</span>
              <span class="stat-badge">~{{ level.totalTime }} мин</span>
            </div>
            <div class="progress-info" v-if="level.progress !== undefined">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: level.progress + '%' }"
                  :class="getProgressClass(level.progress)"
                ></div>
              </div>
              <span class="progress-text">{{ Math.round(level.progress) }}% завершено</span>
            </div>
            <div class="card-footer">
              <span class="access-type" :class="level.hasFreeLessons ? 'has-free' : 'premium-only'">
                {{ level.hasFreeLessons ? '🆓 Есть бесплатные' : '⭐ Только премиум' }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'topics'" class="topics-grid">
          <div
            v-for="topic in filteredTopics"
            :key="topic.topicId"
            class="topic-card"
          >
            <div class="card-header">
              <h3 class="topic-title">{{ topic.name }}</h3>
              <button
                class="add-btn"
                @click="addToStudyPlan(topic)"
                :disabled="topic.inStudyPlan"
                :title="topic.inStudyPlan ? 'Уже в плане' : 'Добавить в план'"
              >
                {{ topic.inStudyPlan ? '✓' : '＋' }}
              </button>
            </div>

            <div class="topic-meta">
              <span class="level-badge" :class="getLevelClass(topic.level)">
                {{ topic.level }}
              </span>
              <span class="access-badge" :class="topic.type === 'premium' ? 'premium' : 'free'">
                {{ topic.type === 'premium' ? '⭐ Премиум' : '🆓 Бесплатный' }}
              </span>
            </div>

            <div class="topic-stats">
              <span>📚 {{ topic.lessonCount }} уроков</span>
              <span>⏱️ {{ topic.totalTime }} мин</span>
            </div>

            <div v-if="topic.progress !== undefined" class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Прогресс</span>
                <span class="progress-percentage">{{ Math.round(topic.progress) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: topic.progress + '%' }"
                  :class="getProgressClass(topic.progress)"
                ></div>
              </div>
            </div>

            <div class="status-section">
              <span
                class="status-badge"
                :class="getStatusClass(topic.progress)"
              >
                {{ getStatusText(topic.progress) }}
              </span>
            </div>

            <button
              class="action-btn"
              @click="handleTopicAccess(topic.topicId, topic.type)"
              :class="getButtonClass(topic.progress)"
            >
              {{ getButtonText(topic.progress) }}
            </button>
          </div>
        </div>

        <div v-if="!loading && filteredItems.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить параметры фильтра</p>
          <button @click="clearFilters" class="btn-secondary">
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showAddModal = false">×</button>
        <div class="modal-header">
          <h3>📚 Добавить в учебный план</h3>
        </div>
        <div class="modal-body">
          <div class="topic-preview" v-if="selectedTopic">
            <h4>{{ selectedTopic.name }}</h4>
            <p>{{ selectedTopic.subject }} • {{ selectedTopic.level }}</p>
            <div class="topic-stats">
              <span>📅 {{ selectedTopic.lessonCount }} уроков</span>
              <span>⏱️ {{ selectedTopic.totalTime }} минут</span>
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
          <p>Тема "{{ selectedTopic?.name }}" добавлена в ваш учебный план.</p>
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
import { mapGetters, mapState } from 'vuex';
import { auth } from '@/firebase';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

// ✅ FIXED: Import API functions instead of using direct axios
import { 
  getAllLessons, 
  getTopics, 
  getLessonsByTopic, 
  getUserProgress,
  getUserStudyList,
  getTopicById,
  addToStudyList 
} from '@/api';

export default {
  name: 'CataloguePage',
  components: {
    PaymentModal
  },

  data() {
    return {
      // Navigation state
      currentView: 'subjects',
      selectedSubject: null,
      selectedLevel: null,

      // Data
      lessons: [],
      subjects: [],
      levels: [],
      topics: [],
      userProgress: {},
      lessonProgress: {},
      studyPlanTopics: [],

      // UI state
      loading: true,
      userId: null,
      lang: '',

      // Filter state - ALL INITIALIZED AS EMPTY/FALSE
      searchQuery: '',
      filterSubject: '',
      filterLevel: '',
      showFree: false,
      showPremium: false,
      showNotStarted: false,
      showInProgress: false,
      showCompleted: false,

      // Modal state
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedTopic: null,
      requestedTopicId: null,

      // ✅ ENHANCED: Add comprehensive reactivity tracking
      componentKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0,
      
      // Event cleanup functions
      eventCleanupFunctions: [],
      storeUnsubscribe: null
    };
  },

  computed: {
    // ✅ FIXED: Map both user state and getters properly
    ...mapState(['user']),
    ...mapGetters(['getUser']),

    // ✅ FIXED: Get current user consistently like UserSection
    currentUser() {
      return this.getUser || this.user || {};
    },

    // ✅ FIXED: Get user status from user object like UserSection
    currentUserStatus() {
      const userStatus = this.currentUser?.subscriptionPlan || 
                        localStorage.getItem('userStatus') || 
                        localStorage.getItem('plan') || 
                        'free';
      return userStatus;
    },

    // ✅ FIXED: Reactive subscription class based on user object
    subscriptionClass() {
      const status = this.currentUserStatus;
      if (status === 'pro') return 'badge-pro';
      if (status === 'start') return 'badge-start';
      return 'badge-free';
    },

    // ✅ FIXED: Reactive subscription text based on user object
    subscriptionText() {
      const status = this.currentUserStatus;
      switch (status) {
        case 'pro': return 'Pro подписка';
        case 'start': return 'Start подписка';
        default: return 'Бесплатный доступ';
      }
    },

    // ✅ FIXED: Check if user has premium access
    isPremiumUser() {
      const status = this.currentUserStatus;
      return status === 'pro' || status === 'start';
    },

    currentItems() {
      switch (this.currentView) {
        case 'subjects': return this.subjects || [];
        case 'levels': return this.levels || [];
        case 'topics': return this.topics || [];
        default: return [];
      }
    },

    filteredItems() {
      switch (this.currentView) {
        case 'subjects': return this.filteredSubjects || [];
        case 'levels': return this.filteredLevels || [];
        case 'topics': return this.filteredTopics || [];
        default: return [];
      }
    },

    availableSubjects() {
      if (!Array.isArray(this.lessons)) return [];
      return [...new Set(this.lessons
        .map(lesson => lesson?.subject)
        .filter(subject => subject && typeof subject === 'string'))];
    },

    availableLevels() {
      if (!Array.isArray(this.lessons)) return [];
      return [...new Set(this.lessons
        .map(lesson => lesson?.level)
        .filter(level => level && (typeof level === 'string' || typeof level === 'number')))];
    },

    filteredSubjects() {
      if (!Array.isArray(this.subjects)) return [];
      return this.subjects.filter(subject => {
        if (!subject || !subject.name) return false;

        const subjectName = String(subject.name || '');
        const searchTerm = String(this.searchQuery || '').toLowerCase();

        const matchesSearch = !this.searchQuery || subjectName.toLowerCase().includes(searchTerm);

        let matchesAccess = true;
        if (this.showFree || this.showPremium) {
          matchesAccess = (this.showFree && subject.hasFreeLessons) ||
                         (this.showPremium && subject.hasPremiumLessons);
        }

        return matchesSearch && matchesAccess;
      });
    },

    filteredLevels() {
      if (!Array.isArray(this.levels)) return [];
      return this.levels.filter(level => {
        if (!level || (!level.name && level.name !== 0)) return false;

        const levelName = String(level.name || '');
        const searchTerm = String(this.searchQuery || '').toLowerCase();

        const matchesSearch = !this.searchQuery || levelName.toLowerCase().includes(searchTerm);

        let matchesAccess = true;
        if (this.showFree || this.showPremium) {
          matchesAccess = (this.showFree && level.hasFreeLessons) ||
                         (this.showPremium && level.hasPremiumLessons);
        }

        return matchesSearch && matchesAccess;
      });
    },

    filteredTopics() {
      if (!Array.isArray(this.topics)) return [];
      return this.topics.filter(topic => {
        if (!topic || !topic.name) return false;

        const topicName = String(topic.name || '');
        const searchTerm = String(this.searchQuery || '').toLowerCase();

        const matchesSearch = !this.searchQuery || topicName.toLowerCase().includes(searchTerm);

        const matchesSubject = !this.filterSubject || String(topic.subject || '') === String(this.filterSubject);

        const matchesLevel = !this.filterLevel || String(topic.level || '') === String(this.filterLevel);

        let matchesAccess = true;
        if (this.showFree || this.showPremium) {
          matchesAccess = (this.showFree && topic.type === 'free') ||
                         (this.showPremium && topic.type === 'premium');
        }

        let matchesProgress = true;
        if (this.showNotStarted || this.showInProgress || this.showCompleted) {
          if (typeof topic.progress === 'number') {
            const progress = Number(topic.progress) || 0;
            const isNotStarted = progress === 0;
            const isInProgress = progress > 0 && progress < 100;
            const isCompleted = progress === 100;

            matchesProgress = (this.showNotStarted && isNotStarted) ||
                             (this.showInProgress && isInProgress) ||
                             (this.showCompleted && isCompleted);
          } else {
            matchesProgress = this.showNotStarted;
          }
        }

        return matchesSearch && matchesSubject && matchesLevel && matchesAccess && matchesProgress;
      });
    }
  },

  // ✅ FIXED: Watch store changes like UserSection does
  watch: {
    // ✅ FIXED: Watch the user object from store (same as UserSection)
    user: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // ✅ FIXED: Watch the getUser getter (same as UserSection)
    getUser: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // ✅ FIXED: Watch current user status computed property
    currentUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    }
  },

  async mounted() {

    try {
      // Initialize component
      await this.initializeComponent();

      // ✅ FIXED: Setup comprehensive event listeners
      this.setupEventListeners();


    } catch (error) {
      console.error('❌ Catalogue: Mount error:', error);
    }
  },

  beforeUnmount() {
    this.cleanup();
  },

  methods: {
    // ===== INITIALIZATION =====
    async initializeComponent() {
      try {
        this.loading = true;
        this.lang = localStorage.getItem('lang') || 'en';

        // Get user ID from multiple sources
        const storedId = this.$store?.state?.firebaseUserId || 
                         localStorage.getItem('firebaseUserId') || 
                         localStorage.getItem('userId');
        
        if (!storedId) {
          console.warn('⚠️ Catalogue: No user ID found, continuing without user data');
          // Don't return here - still load public data
        } else {
          this.userId = storedId;
        }

        // Load all data in parallel with proper error handling
        const dataPromises = [
          this.loadLessons().catch(err => {
            console.error('❌ Lessons loading failed:', err);
            return null;
          }),
          this.userId ? this.loadUserProgress().catch(err => {
            console.error('❌ User progress loading failed:', err);
            return null;
          }) : Promise.resolve(),
          this.userId ? this.loadStudyPlan().catch(err => {
            console.error('❌ Study plan loading failed:', err);
            return null;
          }) : Promise.resolve()
        ];

        await Promise.allSettled(dataPromises);

        // Process subjects after all data is loaded
        this.processSubjects();
        
        
      } catch (error) {
        console.error('❌ Catalogue: Critical initialization error:', error);
        this.showErrorMessage('Ошибка загрузки данных. Попробуйте перезагрузить страницу.');
      } finally {
        this.loading = false;
      }
    },

    // ===== DATA LOADING =====
    async loadLessons() {
      try {
        
        // ✅ FIXED: Use the same API method as MainPage
        const lessonsResult = await getAllLessons();
        
        if (lessonsResult?.success && Array.isArray(lessonsResult.data)) {
          this.lessons = lessonsResult.data;
        } else {
          console.warn('⚠️ Catalogue: Invalid lessons response:', lessonsResult);
          this.lessons = [];
        }
      } catch (error) {
        console.error('❌ Catalogue: Error loading lessons:', error);
        this.lessons = [];
        
        // Try fallback approach
        try {
          const topicsResult = await getTopics({ includeStats: true });
          
          if (topicsResult?.success && Array.isArray(topicsResult.data)) {
            // Extract lessons from topics if available
            const allLessons = [];
            for (const topic of topicsResult.data) {
              try {
                const topicLessons = await getLessonsByTopic(topic._id);
                if (topicLessons?.success && Array.isArray(topicLessons.data)) {
                  allLessons.push(...topicLessons.data);
                }
              } catch (topicError) {
                console.warn('⚠️ Failed to get lessons for topic:', topic._id);
              }
            }
            
            if (allLessons.length > 0) {
              this.lessons = allLessons;
            }
          }
        } catch (fallbackError) {
          console.error('❌ Catalogue: Fallback lessons loading failed:', fallbackError);
        }
      }
    },

    async loadUserProgress() {
      if (!this.userId) {
        console.warn('⚠️ Catalogue: No userId available for loading progress');
        this.userProgress = {};
        return;
      }

      try {
        
        // ✅ FIXED: Use the same API method as MainPage
        const progressResult = await getUserProgress(this.userId);
        
        if (progressResult?.success && Array.isArray(progressResult.data)) {
          // Calculate topic progress from lesson progress data
          await this.calculateTopicProgressFromLessons(progressResult.data);
        } else if (progressResult?.success && typeof progressResult.data === 'object') {
          // Direct topic progress format
          this.userProgress = progressResult.data || {};
        } else {
          console.warn('⚠️ Catalogue: Invalid progress response:', progressResult);
          this.userProgress = {};
        }
      } catch (error) {
        console.error('❌ Catalogue: Error loading user progress:', error);
        this.userProgress = {};
      }
    },

    async loadStudyPlan() {
      if (!this.userId) {
        console.warn('⚠️ Catalogue: No userId available for loading study plan');
        this.studyPlanTopics = [];
        return;
      }

      try {
        
        // ✅ FIXED: Use the same API method as MainPage
        const studyListResult = await getUserStudyList(this.userId);
        
        if (studyListResult?.success && Array.isArray(studyListResult.data)) {
          this.studyPlanTopics = studyListResult.data
            .map(item => {
              if (!item) return '';
              const topicId = item.topicId || item._id || item.id;
              return topicId ? String(topicId) : '';
            })
            .filter(id => id);
          
        } else {
          console.warn('⚠️ Catalogue: Invalid study list response:', studyListResult);
          this.studyPlanTopics = [];
        }
      } catch (error) {
        console.error('❌ Catalogue: Error loading study plan:', error);
        this.studyPlanTopics = [];
      }
    },

    // ✅ ENHANCED: Calculate topic progress from lessons (same as MainPage logic)
    async calculateTopicProgressFromLessons(progressData) {
      if (!Array.isArray(progressData)) {
        console.warn('⚠️ Catalogue: Progress data is not an array for calculation');
        this.userProgress = {};
        return;
      }

      const topicProgressMap = {};
      const topicLessonsCount = {};

      // First, count lessons per topic
      if (Array.isArray(this.lessons)) {
        this.lessons.forEach(lesson => {
          if (!lesson || !lesson.topicId) return;

          const topicId = this.extractTopicId(lesson.topicId);
          if (!topicId) return;

          if (!topicLessonsCount[topicId]) {
            topicLessonsCount[topicId] = { total: 0, completed: 0 };
          }
          topicLessonsCount[topicId].total++;
        });
      }

      // Then, count completed lessons per topic
      progressData.forEach(progress => {
        if (!progress || !progress.completed || !progress.lessonId) return;

        const lessonId = progress.lessonId._id || progress.lessonId;
        if (!lessonId) return;

        const lesson = this.lessons.find(l =>
          l && (String(l._id) === String(lessonId))
        );

        if (lesson && lesson.topicId) {
          const topicId = this.extractTopicId(lesson.topicId);
          if (topicId && topicLessonsCount[topicId]) {
            topicLessonsCount[topicId].completed++;
          }
        }
      });

      // Calculate progress percentages
      Object.keys(topicLessonsCount).forEach(topicId => {
        const topic = topicLessonsCount[topicId];
        if (topic.total > 0) {
          topicProgressMap[topicId] = Math.round((topic.completed / topic.total) * 100);
        } else {
          topicProgressMap[topicId] = 0;
        }
      });

      this.userProgress = topicProgressMap;
    },

    // ===== DATA PROCESSING =====
    processSubjects() {

      if (!Array.isArray(this.lessons) || this.lessons.length === 0) {
        console.warn('⚠️ Catalogue: No lessons available for processing');
        this.subjects = [];
        return;
      }

      const subjectsMap = new Map();

      this.lessons.forEach(lesson => {
        if (!lesson || !lesson.subject) return;

        const subjectName = String(lesson.subject);
        if (!subjectsMap.has(subjectName)) {
          subjectsMap.set(subjectName, {
            name: subjectName,
            icon: this.getSubjectIcon(subjectName),
            levels: new Set(),
            topicCount: 0,
            lessonCount: 0,
            hasFreeLessons: false,
            hasPremiumLessons: false,
            topics: new Set()
          });
        }

        const subject = subjectsMap.get(subjectName);

        // Add level
        if (lesson.level !== null && lesson.level !== undefined) {
          subject.levels.add(String(lesson.level));
        }

        // Add topic
        if (lesson.topicId || lesson.topic) {
          const topicKey = this.extractTopicId(lesson.topicId) || this.getTopicName(lesson);
          if (topicKey) {
            subject.topics.add(String(topicKey));
          }
        }

        subject.lessonCount++;

        // Check lesson types
        const lessonType = lesson.type || 'free';
        if (lessonType === 'free') subject.hasFreeLessons = true;
        if (lessonType === 'premium' || lessonType === 'start' || lessonType === 'pro') {
          subject.hasPremiumLessons = true;
        }
      });

      this.subjects = Array.from(subjectsMap.values()).map(subject => ({
        ...subject,
        levels: Array.from(subject.levels).sort((a, b) => {
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return String(a).localeCompare(String(b));
        }),
        topicCount: subject.topics.size
      }));

    },

    processLevels() {

      if (!Array.isArray(this.lessons) || !this.selectedSubject) {
        this.levels = [];
        return;
      }

      const levelsMap = new Map();

      const subjectLessons = this.lessons.filter(lesson =>
        lesson && lesson.subject === this.selectedSubject
      );


      subjectLessons.forEach(lesson => {
        if (!lesson || (lesson.level === null || lesson.level === undefined)) return;

        const levelName = String(lesson.level);
        if (!levelsMap.has(levelName)) {
          levelsMap.set(levelName, {
            name: levelName,
            topicCount: 0,
            lessonCount: 0,
            totalTime: 0,
            hasFreeLessons: false,
            hasPremiumLessons: false,
            topics: new Set(),
            progress: 0
          });
        }

        const level = levelsMap.get(levelName);

        // Add topic
        if (lesson.topicId || lesson.topic) {
          const topicKey = this.extractTopicId(lesson.topicId) || this.getTopicName(lesson);
          if (topicKey) {
            level.topics.add(String(topicKey));
          }
        }

        level.lessonCount++;
        level.totalTime += this.estimateLessonTime(lesson);

        // Check lesson types
        const lessonType = lesson.type || 'free';
        if (lessonType === 'free') level.hasFreeLessons = true;
        if (lessonType === 'premium' || lessonType === 'start' || lessonType === 'pro') {
          level.hasPremiumLessons = true;
        }
      });

      this.levels = Array.from(levelsMap.values()).map(level => ({
        ...level,
        topicCount: level.topics.size,
        progress: this.calculateLevelProgress(level.name)
      })).sort((a, b) => {
        const aNum = parseInt(a.name);
        const bNum = parseInt(b.name);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return String(a.name).localeCompare(String(b.name));
      });

    },

    processTopics() {

      if (!Array.isArray(this.lessons) || !this.selectedSubject || !this.selectedLevel) {
        this.topics = [];
        return;
      }

      const topicsMap = new Map();

      const levelLessons = this.lessons.filter(lesson =>
        lesson &&
        lesson.subject === this.selectedSubject &&
        String(lesson.level) === String(this.selectedLevel)
      );


      levelLessons.forEach(lesson => {
        if (!lesson) return;

        const topicId = this.extractTopicId(lesson.topicId);
        const name = this.getTopicName(lesson);
        
        if (!topicId || !name) return;

        if (!topicsMap.has(topicId)) {
          topicsMap.set(topicId, {
            topicId,
            name,
            subject: String(lesson.subject || ''),
            level: String(lesson.level || ''),
            type: lesson.type || 'free',
            lessonCount: 1,
            totalTime: this.estimateLessonTime(lesson),
            lessons: [lesson]
          });
        } else {
          const entry = topicsMap.get(topicId);
          entry.lessonCount += 1;
          entry.totalTime += this.estimateLessonTime(lesson);
          entry.lessons.push(lesson);
          
          // Update type to premium if any lesson is premium
          if (lesson.type === 'premium' || lesson.type === 'start' || lesson.type === 'pro') {
            entry.type = 'premium';
          }
        }
      });

      this.topics = Array.from(topicsMap.values()).map(topic => ({
        ...topic,
        progress: Number(this.userProgress[topic.topicId]) || 0,
        inStudyPlan: Array.isArray(this.studyPlanTopics) && 
                     this.studyPlanTopics.includes(topic.topicId)
      }));

    },

    calculateLevelProgress(levelName) {
      if (!this.selectedSubject || !levelName || !Array.isArray(this.lessons)) {
        return 0;
      }

      const levelTopics = this.lessons.filter(l =>
        l && l.subject === this.selectedSubject && String(l.level) === String(levelName)
      );

      if (levelTopics.length === 0) return 0;

      let totalProgress = 0;
      let topicCount = 0;
      const seenTopics = new Set();

      levelTopics.forEach(lesson => {
        if (lesson && lesson.topicId && !seenTopics.has(lesson.topicId)) {
          seenTopics.add(lesson.topicId);
          const progress = Number(this.userProgress[lesson.topicId]) || 0;
          totalProgress += progress;
          topicCount++;
        }
      });

      return topicCount > 0 ? Math.round(totalProgress / topicCount) : 0;
    },

    // ===== NAVIGATION METHODS =====
    selectSubject(subjectName) {
      this.selectedSubject = String(subjectName);
      this.currentView = 'levels';
      this.processLevels();

      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
    },

    selectLevel(levelName) {
      this.selectedLevel = String(levelName);
      this.currentView = 'topics';
      this.processTopics();

      this.searchQuery = '';
    },

    goBack() {
      if (this.currentView === 'topics') {
        this.currentView = 'levels';
        this.selectedLevel = null;
        this.topics = [];
      } else if (this.currentView === 'levels') {
        this.currentView = 'subjects';
        this.selectedSubject = null;
        this.selectedLevel = null;
        this.levels = [];
        this.topics = [];
      }

      this.searchQuery = '';
    },

    // ===== FILTER METHODS =====
    clearFilters() {
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
      this.showFree = false;
      this.showPremium = false;
      this.showNotStarted = false;
      this.showInProgress = false;
      this.showCompleted = false;
    },

    // ===== UTILITY METHODS =====
    getSubjectIcon(subject) {
      const subjectStr = String(subject || '');
      const icons = {
        'Mathematics': '🔢', 'Math': '🔢', 'Математика': '🔢',
        'English': '🇬🇧', 'Английский': '🇬🇧',
        'Science': '🔬', 'Наука': '🔬',
        'History': '📚', 'История': '📚',
        'Geography': '🌍', 'География': '🌍',
        'Programming': '💻', 'Программирование': '💻',
        'Art': '🎨', 'Искусство': '🎨',
        'Music': '🎵', 'Музыка': '🎵',
        'Physics': '⚛️', 'Физика': '⚛️',
        'Chemistry': '🧪', 'Химия': '🧪',
        'Biology': '🧬', 'Биология': '🧬',
        'Literature': '📖', 'Литература': '📖',
        'Economics': '💰', 'Экономика': '💰',
        'Philosophy': '🤔', 'Философия': '🤔'
      };
      return icons[subjectStr] || '📖';
    },

    // ✅ HELPER: Extract topic ID safely (same as MainPage)
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

    // ✅ ENHANCED: Get topic name with fallbacks (same as MainPage)
    getTopicName(lesson) {
      if (!lesson) return 'Без темы';
      
      try {
        // Try direct topic string
        if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
        }
        
        // Try topic object with localization
        if (lesson.topic && typeof lesson.topic === 'object' && lesson.topic !== null) {
          if (lesson.topic[this.lang] && typeof lesson.topic[this.lang] === 'string') {
            return String(lesson.topic[this.lang]).trim();
          }
          if (lesson.topic.en && typeof lesson.topic.en === 'string') {
            return String(lesson.topic.en).trim();
          }
          // Try any string value in topic object
          const anyLangTopic = Object.values(lesson.topic).find(val => 
            typeof val === 'string' && val.trim()
          );
          if (anyLangTopic) return anyLangTopic.trim();
        }
        
        // Try translations
        if (lesson.translations && 
            lesson.translations[this.lang] && 
            lesson.translations[this.lang].topic &&
            typeof lesson.translations[this.lang].topic === 'string') {
          return String(lesson.translations[this.lang].topic).trim();
        }
        
        // Fallback to lesson name
        if (lesson.lessonName && typeof lesson.lessonName === 'string' && lesson.lessonName.trim()) {
          return `Тема: ${lesson.lessonName.trim()}`;
        }
        if (lesson.title && typeof lesson.title === 'string' && lesson.title.trim()) {
          return `Тема: ${lesson.title.trim()}`;
        }
        
        return 'Без темы';
      } catch (error) {
        console.error('❌ Catalogue: Error getting topic name:', error);
        return 'Ошибка названия темы';
      }
    },

    getLevelClass(level) {
      const levelStr = String(level || '').toLowerCase();

      const levelNum = parseInt(levelStr);
      if (!isNaN(levelNum)) {
        if (levelNum >= 1 && levelNum <= 3) return 'level-beginner';
        if (levelNum >= 4 && levelNum <= 6) return 'level-intermediate';
        if (levelNum >= 7 && levelNum <= 10) return 'level-advanced';
      }

      switch (levelStr) {
        case 'beginner':
        case 'начинающий':
        case 'базовый':
          return 'level-beginner';
        case 'intermediate':
        case 'средний':
          return 'level-intermediate';
        case 'advanced':
        case 'продвинутый':
          return 'level-advanced';
        default:
          return 'level-beginner';
      }
    },

    getLevelIcon(level) {
      const levelNum = parseInt(level);
      if (!isNaN(levelNum)) {
        const icons = ['🌱', '🌿', '🍃', '🌳', '🌲', '🏔️', '⭐', '💎', '👑', '🏆'];
        return icons[Math.min(levelNum - 1, icons.length - 1)] || '📚';
      }

      const icons = {
        'beginner': '🌱', 'начинающий': '🌱', 'базовый': '🌱',
        'intermediate': '🌿', 'средний': '🌿',
        'advanced': '🌳', 'продвинутый': '🌳'
      };
      return icons[String(level).toLowerCase()] || '📚';
    },

    getLevelDescription(level) {
      const levelNum = parseInt(level);
      if (!isNaN(levelNum)) {
        const descriptions = {
          1: 'Базовый уровень - начальные понятия и основы',
          2: 'Элементарный уровень - простые упражнения',
          3: 'Начальный уровень - базовые навыки',
          4: 'Ниже среднего - развитие основных умений',
          5: 'Средний уровень - практическое применение',
          6: 'Выше среднего - углубленное изучение',
          7: 'Продвинутый уровень - сложные концепции',
          8: 'Высокий уровень - экспертные навыки',
          9: 'Профессиональный уровень - мастерство',
          10: 'Экспертный уровень - полное владение предметом'
        };
        return descriptions[levelNum] || `Изучение предмета на уровне ${levelNum}`;
      }

      const descriptions = {
        'beginner': 'Начальный уровень для новичков',
        'начинающий': 'Начальный уровень для новичков',
        'базовый': 'Базовые знания и навыки',
        'intermediate': 'Средний уровень сложности',
        'средний': 'Средний уровень сложности',
        'advanced': 'Продвинутый уровень',
        'продвинутый': 'Продвинутый уровень'
      };
      return descriptions[String(level).toLowerCase()] || 'Изучение предмета на данном уровне';
    },

    getProgressClass(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return 'progress-completed';
      if (prog >= 70) return 'progress-high';
      if (prog >= 30) return 'progress-medium';
      if (prog > 0) return 'progress-low';
      return 'progress-none';
    },

    getStatusClass(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return 'completed';
      if (prog > 0) return 'in-progress';
      return 'not-started';
    },

    getStatusText(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return '✅ Завершено';
      if (prog > 0) return '🔄 В процессе';
      return '⭕ Не начато';
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
      return '🚀 Начать';
    },

    // ✅ HELPER: Estimate lesson time
    estimateLessonTime(lesson) {
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      if (lesson.timeToComplete) return parseInt(lesson.timeToComplete);
      
      // Default estimate based on lesson content
      if (lesson.steps && Array.isArray(lesson.steps)) {
        return Math.max(5, lesson.steps.length * 2); // 2 min per step minimum
      }
      
      return 10; // Default 10 minutes
    },

    // ✅ HELPER: Show error message to user
    showErrorMessage(message) {
      console.error('💬 Catalogue: Showing error:', message);
      
      // Try multiple notification methods
      if (this.$toast) {
        this.$toast.error(message, { duration: 5000 });
      } else if (this.$message) {
        this.$message.error(message);
      } else {
        // Fallback to alert
        alert(message);
      }
    },

    // ===== ACTION METHODS =====
    // ✅ ENHANCED: Better error handling for topic access
    handleTopicAccess(topicId, type) {
      if (!topicId) {
        console.error('❌ Catalogue: No topic ID provided');
        return;
      }


      // Check if premium access is required and user doesn't have it
      if ((type === 'premium' || type === 'pro') && !this.isPremiumUser) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
      } else {
        this.$router.push({ 
          name: 'TopicOverview', 
          params: { id: topicId },
          query: { source: 'catalogue-page' }
        });
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

      if (!this.userId) {
        alert('Пожалуйста, войдите в аккаунт, чтобы добавить темы в учебный план.');
        this.showAddModal = false;
        return;
      }

      try {
        
        let topicId = this.selectedTopic.topicId;
        if (typeof topicId === 'object' && topicId !== null) {
          topicId = topicId._id || topicId.id || String(topicId);
        } else if (topicId) {
          topicId = String(topicId);
        } else {
          console.error('❌ No valid topicId found');
          throw new Error('No valid topicId provided');
        }

        // ✅ FIXED: Use API function instead of direct axios
        const studyListData = {
          topicId: topicId,
          topic: String(this.selectedTopic.name || ''),
          topicName: String(this.selectedTopic.name || ''),
          name: String(this.selectedTopic.name || ''),
          subject: String(this.selectedTopic.subject || ''),
          level: String(this.selectedTopic.level || ''),
          lessonCount: Number(this.selectedTopic.lessonCount) || 0,
          totalTime: Number(this.selectedTopic.totalTime) || 0,
          type: this.selectedTopic.type || 'free',
          description: `Курс по теме "${this.selectedTopic.name}" содержит ${this.selectedTopic.lessonCount} уроков`,
          isActive: true,
          addedAt: new Date().toISOString(),
          lessons: this.selectedTopic.lessons || [],
          source: 'catalogue-page'
        };

        const result = await addToStudyList(this.userId, studyListData);

        if (result?.success !== false) {
          // Update local state
          this.selectedTopic.inStudyPlan = true;
          
          if (Array.isArray(this.studyPlanTopics) && !this.studyPlanTopics.includes(topicId)) {
            this.studyPlanTopics.push(topicId);
          }

          if (Array.isArray(this.topics)) {
            const topicIndex = this.topics.findIndex(t => t && t.topicId === topicId);
            if (topicIndex !== -1) {
              this.topics[topicIndex].inStudyPlan = true;
            }
          }

          this.showAddModal = false;
          this.showSuccessModal = true;
          
        } else {
          throw new Error(result?.error || 'Failed to add topic to study list');
        }

      } catch (error) {
        console.error('❌ Catalogue: Error adding to study plan:', error);

        let errorMessage = '❌ Не удалось добавить тему';
        
        if (error.message?.includes('уже добавлен') || error.message?.includes('already exists')) {
          errorMessage = '❌ Тема уже добавлена в учебный план.';
          // Update local state to reflect this
          this.selectedTopic.inStudyPlan = true;
          if (Array.isArray(this.topics)) {
            const topicIndex = this.topics.findIndex(t => t && t.topicId === this.selectedTopic.topicId);
            if (topicIndex !== -1) {
              this.topics[topicIndex].inStudyPlan = true;
            }
          }
        } else if (error.message?.includes('authentication') || error.message?.includes('auth')) {
          errorMessage = '❌ Необходимо войти в аккаунт заново.';
        } else if (error.message?.includes('network') || error.message?.includes('Network')) {
          errorMessage = '❌ Проблема с сетью. Проверьте подключение.';
        } else if (error.message?.includes('server') || (error.response && error.response.status >= 500)) {
          errorMessage = '❌ Ошибка сервера. Попробуйте позже.';
        }

        alert(errorMessage);
        this.showAddModal = false;
      }
    },

    // ✅ FIXED: Handle plan updates the same way UserSection does
    handlePlanUpdate(newPlan) {
      
      // ✅ FIXED: Update store the same way UserSection does
      const updatedUser = {
        ...this.$store.state.user,
        subscriptionPlan: newPlan
      };
      
      // Use the same mutation UserSection uses
      this.$store.commit('setUser', updatedUser);
      
      // ✅ FIXED: Also update localStorage for consistency
      localStorage.setItem('userStatus', newPlan);
      localStorage.setItem('plan', newPlan);
      
      // Trigger reactivity update
      this.triggerReactivityUpdate();
    },

    // ✅ FIXED: Handle user status changes consistently
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;


      // Update localStorage immediately
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('plan', newStatus);

      // Trigger immediate reactivity update
      this.triggerReactivityUpdate();

      // Show celebration for upgrades
      if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
        const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
        if (this.$toast) {
          this.$toast.success(`🎉 ${planLabel} подписка активирована!`, { duration: 5000 });
        }
      }

    },

    // ✅ FIXED: Setup comprehensive event listeners
    setupEventListeners() {

      // ===== DOM EVENT LISTENERS =====
      if (typeof window !== 'undefined') {
        // Listen for user subscription changes
        this.handleSubscriptionChange = (event) => {
          const { plan, oldPlan } = event.detail;
          this.handleUserStatusChange(plan, oldPlan);
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.eventCleanupFunctions.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        // Listen for localStorage changes (cross-tab sync)
        this.handleStorageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        };
        
        window.addEventListener('storage', this.handleStorageChange);
        this.eventCleanupFunctions.push(() => {
          window.removeEventListener('storage', this.handleStorageChange);
        });
      }

      // ===== EVENT BUS LISTENERS =====
      if (typeof window !== 'undefined' && window.eventBus) {
        // User status change events
        this.handleUserStatusEvent = (data) => {
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        // Promocode applied events
        this.handlePromocodeEvent = (data) => {
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        // Force update events
        this.handleForceUpdateEvent = () => {
          this.triggerReactivityUpdate();
        };

        // Register event bus listeners
        const eventTypes = [
          'userStatusChanged',
          'promocodeApplied',
          'forceUpdate',
          'globalForceUpdate',
          'subscriptionUpdated',
          'paymentCompleted'
        ];

        eventTypes.forEach(eventType => {
          const handler = eventType.includes('Status') || eventType.includes('promocode') || 
                         eventType.includes('payment') || eventType.includes('subscription') 
                         ? this.handleUserStatusEvent : this.handleForceUpdateEvent;
          
          window.eventBus.on(eventType, handler);
          this.eventCleanupFunctions.push(() => {
            window.eventBus.off(eventType, handler);
          });
        });

      }

      // ===== STORE MUTATION LISTENER =====
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            this.triggerReactivityUpdate();
          }
        });
      }

    },

    // ✅ FIXED: Trigger comprehensive reactivity update
    triggerReactivityUpdate() {
      this.componentKey++;
      this.forceUpdateCounter++;
      this.lastUpdateTime = Date.now();

      // Force Vue reactivity with multiple strategies
      this.$forceUpdate();

      // Additional delayed updates for maximum compatibility
      this.$nextTick(() => {
        this.$forceUpdate();
      });

     
    },

    // ✅ FIXED: Check if mutation is user-related
    isUserRelatedMutation(mutation) {
      const userMutations = [
        'setUser',
        'SET_USER',
        'updateUser',
        'UPDATE_USER',
        'user/SET_USER_STATUS',
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE'
      ];
      
      return userMutations.some(type => mutation.type.includes(type)) ||
             mutation.type.includes('user/') ||
             mutation.type.toLowerCase().includes('status') ||
             mutation.type.toLowerCase().includes('subscription');
    },

    // ✅ FIXED: Enhanced cleanup method
    cleanup() {

      // Clean up all event listeners
      this.eventCleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('⚠️ Cleanup function failed:', error);
        }
      });
      this.eventCleanupFunctions = [];

      // Clean up store subscription
      if (this.storeUnsubscribe) {
        try {
          this.storeUnsubscribe();
        } catch (error) {
          console.warn('⚠️ Store unsubscribe failed:', error);
        }
        this.storeUnsubscribe = null;
      }

    }
  }
};
</script>
<style>
@import "@/assets/css/CataloguePage.css";

</style>

