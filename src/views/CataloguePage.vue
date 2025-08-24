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
import { 
  getUpdatedCourses, 
  getCourseById, 
  getUserProgress,
  getUserStudyList,
  addToStudyList 
} from '@/api';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

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

      // ✅ UPDATED: Modern course data + legacy compatibility
      courses: [], // Modern course data from API
      lessons: [], // Converted lesson data for backward compatibility
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
      dataSource: 'none', // Track data source for debugging
      
      // Event cleanup functions
      eventCleanupFunctions: []
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
      if (status === 'start' || status === 'premium') return 'badge-start';
      return 'badge-free';
    },

    // ✅ FIXED: Reactive subscription text based on user object
    subscriptionText() {
      const status = this.currentUserStatus;
      switch (status) {
        case 'pro': return 'Pro подписка';
        case 'start':
        case 'premium': return 'Start подписка';
        default: return 'Бесплатный доступ';
      }
    },

    // ✅ FIXED: Check if user has premium access
    isPremiumUser() {
      const status = this.currentUserStatus;
      return status === 'pro' || status === 'start' || status === 'premium';
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
          const topicType = this.getTopicType(topic);
          matchesAccess = (this.showFree && topicType === 'free') ||
                         (this.showPremium && (topicType === 'premium' || topicType === 'pro'));
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
          console.log('👤 Catalogue: User plan changed:', oldPlan, '→', newPlan);
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
          console.log('👤 Catalogue: GetUser plan changed:', oldPlan, '→', newPlan);
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
          console.log('📊 Catalogue: Current user status computed changed:', oldStatus, '→', newStatus);
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    }
  },

  async mounted() {
    console.log('📱 Catalogue: Component mounted');

    try {
      // Initialize component
      await this.initializeComponent();

      // ✅ FIXED: Setup comprehensive event listeners
      this.setupEventListeners();

      console.log('✅ Catalogue: Component mounted successfully');

    } catch (error) {
      console.error('❌ Catalogue: Mount error:', error);
    }
  },

  beforeUnmount() {
    console.log('📱 Catalogue: Component unmounting');
    this.cleanup();
  },

  methods: {
    // ===== INITIALIZATION =====
    async initializeComponent() {
      try {
        this.loading = true;
        this.lang = localStorage.getItem('lang') || 'en';

        const storedId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
        if (!storedId) {
          console.warn('⚠️ No user ID found in localStorage');
          this.loading = false;
          return;
        }
        this.userId = storedId;

        await Promise.all([
          this.loadCourses(),
          this.loadUserProgress(),
          this.loadStudyPlan()
        ]);

        this.processSubjects();
      } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        this.loading = false;
      } finally {
        this.loading = false;
      }
    },

    // ===== UPDATED DATA LOADING =====
    async loadCourses() {
      try {
        console.log('📚 Loading courses from updated API...');
        
        // Use the same API as MainPage
        const result = await getUpdatedCourses();
        
        if (result?.success && Array.isArray(result.courses)) {
          this.courses = result.courses;
          this.dataSource = 'courses';
          console.log('✅ Loaded', this.courses.length, 'courses');
          
          // Convert courses to lessons format for compatibility
          this.lessons = this.convertCoursesToLessons(this.courses);
          console.log('✅ Converted to', this.lessons.length, 'lessons');
          
          return this.courses;
        } else {
          console.warn('⚠️ No courses found in API response');
          this.courses = [];
          this.lessons = [];
          this.dataSource = 'none';
          return [];
        }
      } catch (error) {
        console.error('❌ Error loading courses:', error);
        this.courses = [];
        this.dataSource = 'error';
        
        // Fallback to legacy lesson loading
        return this.loadLessonsLegacy();
      }
    },

    // Convert courses to lesson-like objects for backward compatibility
    convertCoursesToLessons(courses) {
      const lessons = [];
      
      courses.forEach(course => {
        if (!course?.curriculum) {
          // If no curriculum, create a single lesson from the course
          const lessonObj = {
            _id: `${course.id}_main`,
            lessonName: course.title || course.name || 'Основной урок',
            title: course.title || course.name || 'Основной урок',
            subject: course.category || course.subject || 'General',
            level: this.extractLevel(course),
            type: this.extractType(course),
            topicId: course.id || course._id,
            topic: course.title || course.name,
            description: course.description || '',
            duration: course.estimatedDuration || '30 мин',
            steps: [],
            // Course metadata
            courseTitle: course.title || course.name,
            courseId: course.id || course._id,
            courseInstructor: course.instructor?.name,
            courseThumbnail: course.thumbnail,
            isMainLesson: true
          };
          lessons.push(lessonObj);
          return;
        }
        
        course.curriculum.forEach((lesson, index) => {
          const lessonObj = {
            _id: lesson.id || lesson._id || `${course.id}_lesson_${index}`,
            lessonName: lesson.title || `Урок ${index + 1}`,
            title: lesson.title || `Урок ${index + 1}`,
            subject: course.category || course.subject || 'General',
            level: this.extractLevel(course),
            type: this.extractType(course),
            topicId: course.id || course._id,
            topic: course.title || course.name,
            description: lesson.description || course.description,
            duration: lesson.duration || '30 мин',
            steps: lesson.steps || [],
            // Course metadata
            courseTitle: course.title || course.name,
            courseId: course.id || course._id,
            courseInstructor: course.instructor?.name,
            courseThumbnail: course.thumbnail,
            lessonIndex: index
          };
          
          lessons.push(lessonObj);
        });
      });
      
      return lessons;
    },

    // Extract level from course with fallbacks
    extractLevel(course) {
      if (course.difficulty) return course.difficulty;
      if (course.level) return course.level;
      
      // Try to extract from title or description
      const text = `${course.title || ''} ${course.description || ''}`.toLowerCase();
      
      if (text.includes('beginner') || text.includes('начинающ') || text.includes('базов')) return 1;
      if (text.includes('intermediate') || text.includes('средн')) return 2;
      if (text.includes('advanced') || text.includes('продвинут')) return 3;
      
      return 1; // Default to beginner
    },

    // Extract type from course with fallbacks
    extractType(course) {
      if (course.tier) {
        const tier = course.tier.toLowerCase();
        if (tier === 'free') return 'free';
        if (tier === 'premium' || tier === 'start') return 'premium';
        if (tier === 'pro') return 'pro';
      }
      
      if (course.type) {
        const type = course.type.toLowerCase();
        if (type === 'free') return 'free';
        if (type === 'premium' || type === 'paid') return 'premium';
        if (type === 'pro') return 'pro';
      }
      
      // Default to free if not specified
      return 'free';
    },

    // Fallback to legacy lesson loading if courses fail
    async loadLessonsLegacy() {
      try {
        console.log('🔄 Falling back to legacy lesson loading...');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/lessons`);
        const data = await response.json();
        
        this.lessons = Array.isArray(data) ? data : [];
        this.dataSource = 'lessons';
        console.log('✅ Loaded legacy lessons:', this.lessons.length);
        return this.lessons;
      } catch (error) {
        console.error('❌ Error loading legacy lessons:', error);
        this.lessons = [];
        this.dataSource = 'error';
        return [];
      }
    },

    async loadUserProgress() {
      if (!this.userId) {
        console.warn('⚠️ No userId available for loading progress');
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('⚠️ No current user authenticated');
          this.userProgress = {};
          return;
        }

        const token = await currentUser.getIdToken();
        if (!token) {
          console.warn('⚠️ No auth token available');
          this.userProgress = {};
          return;
        }

        try {
          // Try the enhanced progress endpoint first
          const progressResult = await getUserProgress(this.userId);
          
          if (progressResult?.success && Array.isArray(progressResult.data)) {
            await this.calculateTopicProgressFromLessons(progressResult.data);
            console.log('✅ Loaded user progress:', Object.keys(this.userProgress).length, 'topics');
            return;
          }
        } catch (progressError) {
          console.warn('⚠️ Enhanced progress loading failed:', progressError);
        }

        // Fallback: try direct API call
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/${this.userId}/progress`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.ok) {
            const data = await response.json();
            const progressData = data.data || data || [];
            
            if (Array.isArray(progressData)) {
              await this.calculateTopicProgressFromLessons(progressData);
            } else {
              console.warn('⚠️ Progress data is not an array:', typeof progressData);
              this.userProgress = {};
            }
          } else {
            console.warn('⚠️ Progress API returned:', response.status);
            this.userProgress = {};
          }
        } catch (directError) {
          console.warn('⚠️ Direct progress API failed:', directError);
          this.userProgress = {};
        }
      } catch (error) {
        console.error('❌ Error loading user progress:', error);
        this.userProgress = {};
      }
    },

    async calculateTopicProgressFromLessons(progressData) {
      if (!Array.isArray(progressData)) {
        console.warn('⚠️ Progress data is not an array for calculation');
        this.userProgress = {};
        return;
      }

      const topicProgressMap = {};
      const topicLessonsCount = {};

      // Build topic lesson counts from lessons data
      if (Array.isArray(this.lessons)) {
        this.lessons.forEach(lesson => {
          if (!lesson || !lesson.topicId) return;

          const topicId = String(lesson.topicId);
          if (!topicLessonsCount[topicId]) {
            topicLessonsCount[topicId] = { total: 0, completed: 0 };
          }
          topicLessonsCount[topicId].total++;
        });
      }

      // Also count from courses if available
      if (Array.isArray(this.courses)) {
        this.courses.forEach(course => {
          if (!course?.id && !course?._id) return;

          const topicId = String(course.id || course._id);
          const lessonCount = course.curriculum?.length || 1;
          
          if (!topicLessonsCount[topicId]) {
            topicLessonsCount[topicId] = { total: 0, completed: 0 };
          }
          topicLessonsCount[topicId].total = Math.max(
            topicLessonsCount[topicId].total, 
            lessonCount
          );
        });
      }

      // Calculate completed lessons per topic
      progressData.forEach(progress => {
        if (!progress || !progress.completed || !progress.lessonId) return;

        const lessonId = progress.lessonId._id || progress.lessonId;
        if (!lessonId) return;

        const lesson = this.lessons.find(l =>
          l && (String(l._id) === String(lessonId))
        );

        if (lesson && lesson.topicId) {
          const topicId = String(lesson.topicId);
          if (topicLessonsCount[topicId]) {
            topicLessonsCount[topicId].completed++;
          }
        }
      });

      // Calculate percentages
      Object.keys(topicLessonsCount).forEach(topicId => {
        const topic = topicLessonsCount[topicId];
        if (topic.total > 0) {
          topicProgressMap[topicId] = Math.round((topic.completed / topic.total) * 100);
        } else {
          topicProgressMap[topicId] = 0;
        }
      });

      this.userProgress = topicProgressMap;
      console.log('✅ Calculated topic progress for', Object.keys(topicProgressMap).length, 'topics');
    },

    async loadStudyPlan() {
      if (!this.userId) {
        console.warn('⚠️ No userId available for loading study plan');
        return;
      }

      try {
        const result = await getUserStudyList(this.userId);
        
        if (result?.success && Array.isArray(result.data)) {
          this.studyPlanTopics = result.data.map(item => {
            if (!item) return '';
            const topicId = item.topicId || item._id || item.id;
            return topicId ? String(topicId) : '';
          }).filter(id => id);

          console.log('✅ Loaded study plan with', this.studyPlanTopics.length, 'topics');
        } else {
          console.warn('⚠️ Study plan data not available');
          this.studyPlanTopics = [];
        }
      } catch (error) {
        console.error('❌ Error loading study plan:', error);
        this.studyPlanTopics = [];
      }
    },

    // ===== ENHANCED DATA PROCESSING =====
    processSubjects() {
      console.log('🔄 Processing subjects from', this.lessons.length, 'lessons and', (this.courses || []).length, 'courses');

      if (!Array.isArray(this.lessons) && !Array.isArray(this.courses)) {
        console.warn('⚠️ No data to process');
        this.subjects = [];
        this.loading = false;
        return;
      }

      const subjectsMap = new Map();

      // Process lessons (converted from courses or legacy)
      if (Array.isArray(this.lessons)) {
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
              topics: new Set(),
              courses: new Set()
            });
          }

          const subject = subjectsMap.get(subjectName);

          if (lesson.level !== null && lesson.level !== undefined) {
            subject.levels.add(String(lesson.level));
          }

          if (lesson.topicId || lesson.topic) {
            const topicKey = lesson.topicId || lesson.topic;
            if (topicKey) {
              subject.topics.add(String(topicKey));
            }
          }

          // Track courses
          if (lesson.courseId) {
            subject.courses.add(lesson.courseId);
          }

          subject.lessonCount++;

          if (lesson.type === 'free') subject.hasFreeLessons = true;
          if (lesson.type === 'premium' || lesson.type === 'start' || lesson.type === 'pro') {
            subject.hasPremiumLessons = true;
          }
        });
      }

      // Also process courses directly for additional metadata
      if (Array.isArray(this.courses)) {
        this.courses.forEach(course => {
          const subjectName = course.category || course.subject || 'General';
          
          if (!subjectsMap.has(subjectName)) {
            subjectsMap.set(subjectName, {
              name: subjectName,
              icon: this.getSubjectIcon(subjectName),
              levels: new Set(),
              topicCount: 0,
              lessonCount: 0,
              hasFreeLessons: false,
              hasPremiumLessons: false,
              topics: new Set(),
              courses: new Set()
            });
          }

          const subject = subjectsMap.get(subjectName);
          
          // Add course data
          subject.courses.add(course.id || course._id);
          subject.topics.add(course.title || course.name);
          
          if (course.difficulty || course.level) {
            subject.levels.add(String(course.difficulty || course.level));
          }
          
          const courseType = this.extractType(course);
          if (courseType === 'free') subject.hasFreeLessons = true;
          if (courseType === 'premium' || courseType === 'pro') {
            subject.hasPremiumLessons = true;
          }
        });
      }

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
        topicCount: Math.max(subject.topics.size, subject.courses.size),
        courseCount: subject.courses.size
      }));

      console.log('✅ Processed', this.subjects.length, 'subjects');
      this.loading = false;
    },

    processLevels() {
      console.log('🔄 Processing levels for subject:', this.selectedSubject);

      if (!Array.isArray(this.lessons) || !this.selectedSubject) {
        this.levels = [];
        return;
      }

      const levelsMap = new Map();

      const subjectLessons = this.lessons.filter(lesson =>
        lesson && lesson.subject === this.selectedSubject
      );

      console.log('📚 Found', subjectLessons.length, 'lessons for subject');

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

        if (lesson.topicId || lesson.topic) {
          const topicKey = lesson.topicId || this.getTopicName(lesson);
          if (topicKey) {
            level.topics.add(String(topicKey));
          }
        }

        level.lessonCount++;
        level.totalTime += this.estimateLessonTime(lesson);

        if (lesson.type === 'free') level.hasFreeLessons = true;
        if (lesson.type === 'premium' || lesson.type === 'pro') level.hasPremiumLessons = true;
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

      console.log('✅ Processed', this.levels.length, 'levels');
    },

    processTopics() {
      console.log('🔄 Processing topics for:', this.selectedSubject, this.selectedLevel);

      if (!this.selectedSubject || !this.selectedLevel) {
        this.topics = [];
        return;
      }

      const topicsMap = new Map();

      // Process from courses first (preferred)
      if (Array.isArray(this.courses)) {
        this.courses
          .filter(course => 
            course &&
            (course.category === this.selectedSubject || course.subject === this.selectedSubject) &&
            String(course.difficulty || course.level || 1) === String(this.selectedLevel)
          )
          .forEach(course => {
            const topicId = course.id || course._id;
            if (!topicId) return;

            topicsMap.set(topicId, {
              topicId: topicId,
              name: course.title || course.name,
              subject: course.category || course.subject || this.selectedSubject,
              level: String(course.difficulty || course.level || this.selectedLevel),
              type: this.extractType(course),
              lessonCount: course.curriculum?.length || course.lessonCount || 1,
              totalTime: course.estimatedDuration || 
                        (course.curriculum?.length || 1) * 30, // 30 min per lesson estimate
              lessons: course.curriculum || [],
              description: course.description,
              instructor: course.instructor?.name,
              thumbnail: course.thumbnail,
              dataSource: 'course'
            });
          });
      }

      // Fallback: Process from lessons if no courses found
      if (topicsMap.size === 0 && Array.isArray(this.lessons)) {
        const levelLessons = this.lessons.filter(lesson =>
          lesson &&
          lesson.subject === this.selectedSubject &&
          String(lesson.level) === String(this.selectedLevel)
        );

        console.log('📚 Found', levelLessons.length, 'lessons for level (fallback)');

        levelLessons.forEach(lesson => {
          if (!lesson) return;

          let topicId = lesson.topicId;
          if (typeof topicId === 'object' && topicId !== null) {
            topicId = topicId._id || topicId.id || String(topicId);
          } else if (topicId) {
            topicId = String(topicId);
          }

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
              lessons: [lesson],
              dataSource: 'lesson'
            });
          } else {
            const entry = topicsMap.get(topicId);
            entry.lessonCount += 1;
            entry.totalTime += this.estimateLessonTime(lesson);
            entry.lessons.push(lesson);
          }
        });
      }

      this.topics = Array.from(topicsMap.values()).map(topic => ({
        ...topic,
        progress: Number(this.userProgress[topic.topicId]) || 0,
        inStudyPlan: Array.isArray(this.studyPlanTopics) && 
                     this.studyPlanTopics.includes(topic.topicId)
      }));

      console.log('✅ Processed', this.topics.length, 'topics');
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
      console.log('🎯 Selecting subject:', subjectName);
      this.selectedSubject = String(subjectName);
      this.currentView = 'levels';
      this.processLevels();

      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
    },

    selectLevel(levelName) {
      console.log('🎯 Selecting level:', levelName);
      this.selectedLevel = String(levelName);
      this.currentView = 'topics';
      this.processTopics();

      this.searchQuery = '';
    },

    goBack() {
      console.log('🔄 Going back from:', this.currentView);
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
      const subjectStr = String(subject || '').toLowerCase();
      const icons = {
        'mathematics': '🔢', 'math': '🔢', 'математика': '🔢',
        'english': '🇬🇧', 'английский': '🇬🇧',
        'science': '🔬', 'наука': '🔬',
        'history': '📚', 'история': '📚',
        'geography': '🌍', 'география': '🌍',
        'programming': '💻', 'программирование': '💻',
        'art': '🎨', 'искусство': '🎨',
        'music': '🎵', 'музыка': '🎵',
        'physics': '⚛️', 'физика': '⚛️',
        'chemistry': '🧪', 'химия': '🧪',
        'biology': '🧬', 'биология': '🧬',
        'literature': '📖', 'литература': '📖',
        'economics': '💰', 'экономика': '💰',
        'philosophy': '🤔', 'философия': '🤔',
        'technology': '💻', 'технология': '💻',
        'general': '📚', 'общий': '📚'
      };
      return icons[subjectStr] || '📖';
    },

    getTopicName(lessonOrCourse) {
      if (!lessonOrCourse) return 'Без темы';

      try {
        // For course objects
        if (lessonOrCourse.title || lessonOrCourse.name) {
          return lessonOrCourse.title || lessonOrCourse.name;
        }

        // For lesson objects (existing logic)
        if (typeof lessonOrCourse.topic === 'string' && lessonOrCourse.topic.trim()) {
          return lessonOrCourse.topic.trim();
        }

        if (lessonOrCourse.topic && typeof lessonOrCourse.topic === 'object' && lessonOrCourse.topic !== null) {
          if (lessonOrCourse.topic[this.lang] && typeof lessonOrCourse.topic[this.lang] === 'string') {
            return String(lessonOrCourse.topic[this.lang]).trim();
          }
          if (lessonOrCourse.topic.en && typeof lessonOrCourse.topic.en === 'string') {
            return String(lessonOrCourse.topic.en).trim();
          }
          const anyLangTopic = Object.values(lessonOrCourse.topic).find(val => typeof val === 'string' && val.trim());
          if (anyLangTopic) return anyLangTopic.trim();
        }

        if (lessonOrCourse.translations &&
            lessonOrCourse.translations[this.lang] &&
            lessonOrCourse.translations[this.lang].topic &&
            typeof lessonOrCourse.translations[this.lang].topic === 'string') {
          return String(lessonOrCourse.translations[this.lang].topic).trim();
        }

        if (lessonOrCourse.lessonName && typeof lessonOrCourse.lessonName === 'string' && lessonOrCourse.lessonName.trim()) {
            return `Тема: ${lessonOrCourse.lessonName.trim()}`;
        }

        return 'Без темы';
      } catch (error) {
        console.error('❌ Error getting topic name:', error);
        return 'Ошибка названия темы';
      }
    },

    getTopicType(topic) {
      if (!topic) return 'free';
      
      const type = topic.type || topic.tier || topic.accessType || 'free';
      const normalizedType = String(type).toLowerCase();
      
      if (normalizedType === 'pro') return 'pro';
      if (normalizedType === 'premium' || normalizedType === 'start') return 'premium';
      return 'free';
    },

    estimateLessonTime(lesson) {
      if (lesson.duration) {
        const duration = String(lesson.duration);
        const minutes = parseInt(duration.match(/\d+/)?.[0] || '30');
        return minutes;
      }
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.totalTime) return parseInt(lesson.totalTime);
      return 30; // Default 30 minutes
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

    // ===== ACTION METHODS =====
    handleTopicAccess(topicId, type) {
      if (!topicId) {
        console.error('❌ No topic ID provided');
        return;
      }

      // ✅ FIXED: Use consistent premium check
      const needsPremium = (type === 'premium' || type === 'pro') && !this.isPremiumUser;
      
      if (needsPremium) {
        console.log('🔒 Premium access required for topic:', topicId, 'type:', type);
        this.requestedTopicId = topicId;
        this.showPaywall = true;
      } else {
        console.log('🚀 Opening topic:', topicId);
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
      if (!currentUser || !this.userId) {
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

        const topicData = {
          subject: String(this.selectedTopic.subject || ''),
          level: String(this.selectedTopic.level || ''),
          topic: String(this.selectedTopic.name || ''),
          topicName: String(this.selectedTopic.name || ''),
          name: String(this.selectedTopic.name || ''),
          topicId: topicId,
          lessonCount: Number(this.selectedTopic.lessonCount) || 0,
          totalTime: Number(this.selectedTopic.totalTime) || 0,
          type: this.selectedTopic.type || 'free'
        };

        const result = await addToStudyList(this.userId, topicData);

        if (result?.success !== false) {
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
          throw new Error(result?.error || 'Failed to add to study plan');
        }

      } catch (error) {
        console.error('❌ Error adding to study plan:', error);

        let errorMessage = '❌ Не удалось добавить тему';
        if (error.response?.status === 400) {
          errorMessage = '❌ Неверные данные. Проверьте правильность заполнения.';
        } else if (error.response?.status === 401) {
          errorMessage = '❌ Необходимо войти в аккаунт заново.';
        } else if (error.response?.status === 403) {
          errorMessage = '❌ Недостаточно прав для выполнения операции.';
        } else if (error.response?.status === 409) {
          errorMessage = '❌ Тема уже добавлена в учебный план.';
        }

        alert(errorMessage);
        this.showAddModal = false;
      }
    },

    // ✅ FIXED: Handle plan updates the same way UserSection does
    handlePlanUpdate(newPlan) {
      console.log('💳 Catalogue: Plan updated to:', newPlan);
      
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
      
      // Close paywall
      this.showPaywall = false;
      this.requestedTopicId = null;
    },

    // ✅ FIXED: Handle user status changes consistently
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;

      console.log(`👤 Catalogue: Handling status change ${oldStatus} → ${newStatus}`);

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

      console.log(`✅ Catalogue: Status change handled: ${oldStatus} → ${newStatus}`);
    },

    // ✅ FIXED: Setup comprehensive event listeners
    setupEventListeners() {
      console.log('🔧 Catalogue: Setting up event listeners');

      // ===== DOM EVENT LISTENERS =====
      if (typeof window !== 'undefined') {
        // Listen for user subscription changes
        this.handleSubscriptionChange = (event) => {
          console.log('📡 Catalogue: Subscription change received:', event.detail);
          const { plan, oldPlan } = event.detail;
          this.handleUserStatusChange(plan, oldPlan);
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.eventCleanupFunctions.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        // Listen for localStorage changes (cross-tab sync)
        this.handleStorageChange = (event) => {
          if ((event.key === 'userStatus' || event.key === 'plan') && event.newValue !== event.oldValue) {
            console.log('📡 Catalogue: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
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
          console.log('📡 Catalogue: User status event received:', data);
          this.handleUserStatusChange(data.newStatus || data.plan, data.oldStatus || data.oldPlan);
        };

        // Force update events
        this.handleForceUpdateEvent = () => {
          console.log('📡 Catalogue: Force update event received');
          this.triggerReactivityUpdate();
        };

        // Register event bus listeners
        const eventTypes = [
          'userStatusChanged',
          'promocodeApplied',
          'subscriptionUpdated',
          'paymentCompleted'
        ];

        eventTypes.forEach(eventType => {
          window.eventBus.on(eventType, this.handleUserStatusEvent);
          this.eventCleanupFunctions.push(() => {
            window.eventBus.off(eventType, this.handleUserStatusEvent);
          });
        });

        const forceUpdateTypes = [
          'forceUpdate',
          'globalForceUpdate'
        ];

        forceUpdateTypes.forEach(eventType => {
          window.eventBus.on(eventType, this.handleForceUpdateEvent);
          this.eventCleanupFunctions.push(() => {
            window.eventBus.off(eventType, this.handleForceUpdateEvent);
          });
        });

        console.log('✅ Catalogue: Event bus listeners registered');
      }

      // ===== STORE MUTATION LISTENER =====
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            console.log('📊 Catalogue: Store mutation detected:', mutation.type);
            this.triggerReactivityUpdate();
            
            // Handle subscription plan changes
            if (mutation.payload?.subscriptionPlan) {
              const newPlan = mutation.payload.subscriptionPlan;
              const oldPlan = this.currentUserStatus;
              if (newPlan !== oldPlan) {
                this.handleUserStatusChange(newPlan, oldPlan);
              }
            }
          }
        });
        
        this.eventCleanupFunctions.push(() => {
          if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
            this.storeUnsubscribe = null;
          }
        });
      }

      console.log('✅ Catalogue: Event listeners setup complete');
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

      console.log('🔄 Catalogue: Reactivity update triggered:', {
        componentKey: this.componentKey,
        userStatus: this.currentUserStatus,
        timestamp: this.lastUpdateTime
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
             mutation.type.toLowerCase().includes('subscription') ||
             mutation.type.toLowerCase().includes('plan');
    },

    // ✅ FIXED: Enhanced cleanup method
    cleanup() {
      console.log('🧹 Catalogue: Performing cleanup...');

      // Clean up all event listeners
      this.eventCleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('⚠️ Cleanup function failed:', error);
        }
      });
      this.eventCleanupFunctions = [];

      console.log('✅ Catalogue: Cleanup completed');
    }
  }
};
</script>
<style>
@import "@/assets/css/CataloguePage.css";

</style>

