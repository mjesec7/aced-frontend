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
import axios from 'axios';
import { mapGetters, mapState } from 'vuex';
import { auth } from '@/firebase';
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
      forceUpdateCounter: 0
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
          this.loadLessons(),
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

    // ===== DATA LOADING =====
    async loadLessons() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons`);
        this.lessons = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Loaded lessons:', this.lessons.length);
      } catch (error) {
        console.error('❌ Error loading lessons:', error);
        this.lessons = [];
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
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/topics-progress`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data && typeof response.data === 'object') {
            this.userProgress = response.data;
            console.log('✅ Loaded topics progress:', Object.keys(this.userProgress).length);
            return;
          }
        } catch (topicProgressError) {
          console.warn('⚠️ Topics-progress endpoint failed, falling back:', topicProgressError.response?.status);
        }

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/progress`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const progressData = response.data?.data || response.data || [];
          if (Array.isArray(progressData)) {
            await this.calculateTopicProgressFromLessons(progressData);
          } else {
            console.warn('⚠️ Progress data is not an array:', typeof progressData);
            this.userProgress = {};
          }
        } catch (userProgressError) {
          console.warn('⚠️ User progress endpoint failed:', userProgressError.response?.status);
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
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('⚠️ No current user authenticated for study plan');
          this.studyPlanTopics = [];
          return;
        }

        const token = await currentUser.getIdToken();
        if (!token) {
          console.warn('⚠️ No auth token available for study plan');
          this.studyPlanTopics = [];
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data;
        if (Array.isArray(data)) {
          this.studyPlanTopics = data.map(item => {
            if (!item) return '';
            const topicId = item.topicId || item._id || item.id;
            return topicId ? String(topicId) : '';
          }).filter(id => id);

          console.log('✅ Loaded study plan with', this.studyPlanTopics.length, 'topics');
        } else {
          console.warn('⚠️ Study plan data is not an array:', typeof data);
          this.studyPlanTopics = [];
        }
      } catch (error) {
        console.error('❌ Error loading study plan:', error);
        this.studyPlanTopics = [];
      }
    },

    // ===== DATA PROCESSING =====
    processSubjects() {
      console.log('🔄 Processing subjects from', this.lessons.length, 'lessons');

      if (!Array.isArray(this.lessons)) {
        console.warn('⚠️ Lessons is not an array');
        this.subjects = [];
        this.loading = false;
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

        if (lesson.level !== null && lesson.level !== undefined) {
          subject.levels.add(String(lesson.level));
        }

        if (lesson.topicId || lesson.topic) {
          const topicKey = lesson.topicId || this.getTopicName(lesson);
          if (topicKey) {
            subject.topics.add(String(topicKey));
          }
        }

        subject.lessonCount++;

        if (lesson.type === 'free') subject.hasFreeLessons = true;
        if (lesson.type === 'premium') subject.hasPremiumLessons = true;
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
        level.totalTime += 10;

        if (lesson.type === 'free') level.hasFreeLessons = true;
        if (lesson.type === 'premium') level.hasPremiumLessons = true;
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

      console.log('📚 Found', levelLessons.length, 'lessons for level');

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
            totalTime: 10,
            lessons: [lesson]
          });
        } else {
          const entry = topicsMap.get(topicId);
          entry.lessonCount += 1;
          entry.totalTime += 10;
          entry.lessons.push(lesson);
        }
      });

      this.topics = Array.from(topicsMap.values()).map(topic => ({
        ...topic,
        progress: Number(this.userProgress[topic.topicId]) || 0,
        inStudyPlan: Array.isArray(this.studyPlanTopics) && this.studyPlanTopics.includes(topic.topicId)
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

    getTopicName(lesson) {
      if (!lesson) return 'Без темы';

      try {
        if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
        }

        if (lesson.topic && typeof lesson.topic === 'object' && lesson.topic !== null) {
          if (lesson.topic[this.lang] && typeof lesson.topic[this.lang] === 'string') {
            return String(lesson.topic[this.lang]).trim();
          }
          if (lesson.topic.en && typeof lesson.topic.en === 'string') {
            return String(lesson.topic.en).trim();
          }
          const anyLangTopic = Object.values(lesson.topic).find(val => typeof val === 'string' && val.trim());
          if (anyLangTopic) return anyLangTopic.trim();
        }

        if (lesson.translations &&
            lesson.translations[this.lang] &&
            lesson.translations[this.lang].topic &&
            typeof lesson.translations[this.lang].topic === 'string') {
          return String(lesson.translations[this.lang].topic).trim();
        }

        if (lesson.lessonName && typeof lesson.lessonName === 'string' && lesson.lessonName.trim()) {
            return `Тема: ${lesson.lessonName.trim()}`;
        }
        if (lesson.title && typeof lesson.title === 'string' && lesson.title.trim()) {
            return `Тема: ${lesson.title.trim()}`;
        }

        return 'Без темы';
      } catch (error) {
        console.error('❌ Error getting topic name:', error);
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

    // ===== ACTION METHODS =====
    handleTopicAccess(topicId, type) {
      if (!topicId) {
        console.error('❌ No topic ID provided');
        return;
      }

      // ✅ FIXED: Use consistent premium check
      if ((type === 'premium' || type === 'pro') && !this.isPremiumUser) {
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
      if (!currentUser || !this.userId) {
        alert('Пожалуйста, войдите в аккаунт, чтобы добавить темы в учебный план.');
        this.showAddModal = false;
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const url = `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/study-list`;

        let topicId = this.selectedTopic.topicId;
        if (typeof topicId === 'object' && topicId !== null) {
          topicId = topicId._id || topicId.id || String(topicId);
        } else if (topicId) {
          topicId = String(topicId);
        } else {
          console.error('❌ No valid topicId found');
          throw new Error('No valid topicId provided');
        }

        const body = {
          subject: String(this.selectedTopic.subject || ''),
          level: String(this.selectedTopic.level || ''),
          topic: String(this.selectedTopic.name || ''),
          topicId: topicId,
          lessonCount: Number(this.selectedTopic.lessonCount) || 0,
          totalTime: Number(this.selectedTopic.totalTime) || 0,
          type: this.selectedTopic.type || 'free'
        };

        await axios.post(url, body, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

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

        // Listen for localStorage changes (cross-tab sync)
        this.handleStorageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
            console.log('📡 Catalogue: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        };
        
        window.addEventListener('storage', this.handleStorageChange);
      }

      // ===== EVENT BUS LISTENERS =====
      if (typeof window !== 'undefined' && window.eventBus) {
        // User status change events
        this.handleUserStatusEvent = (data) => {
          console.log('📡 Catalogue: User status event received:', data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        // Promocode applied events
        this.handlePromocodeEvent = (data) => {
          console.log('📡 Catalogue: Promocode applied event:', data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        // Force update events
        this.handleForceUpdateEvent = () => {
          console.log('📡 Catalogue: Force update event received');
          this.triggerReactivityUpdate();
        };

        // Register event bus listeners
        window.eventBus.on('userStatusChanged', this.handleUserStatusEvent);
        window.eventBus.on('promocodeApplied', this.handlePromocodeEvent);
        window.eventBus.on('forceUpdate', this.handleForceUpdateEvent);
        window.eventBus.on('globalForceUpdate', this.handleForceUpdateEvent);
        window.eventBus.on('subscriptionUpdated', this.handleUserStatusEvent);
        window.eventBus.on('paymentCompleted', this.handleUserStatusEvent);

        console.log('✅ Catalogue: Event bus listeners registered');
      }

      // ===== STORE MUTATION LISTENER =====
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            console.log('📊 Catalogue: Store mutation detected:', mutation.type);
            this.triggerReactivityUpdate();
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
             mutation.type.toLowerCase().includes('subscription');
    },

    // ✅ FIXED: Enhanced cleanup method
    cleanup() {
      console.log('🧹 Catalogue: Performing cleanup...');

      // Clean up DOM event listeners
      if (typeof window !== 'undefined') {
        if (this.handleSubscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        }
        if (this.handleStorageChange) {
          window.removeEventListener('storage', this.handleStorageChange);
        }
      }

      // Clean up event bus listeners
      if (typeof window !== 'undefined' && window.eventBus) {
        if (this.handleUserStatusEvent) {
          window.eventBus.off('userStatusChanged', this.handleUserStatusEvent);
          window.eventBus.off('subscriptionUpdated', this.handleUserStatusEvent);
          window.eventBus.off('paymentCompleted', this.handleUserStatusEvent);
        }
        if (this.handlePromocodeEvent) {
          window.eventBus.off('promocodeApplied', this.handlePromocodeEvent);
        }
        if (this.handleForceUpdateEvent) {
          window.eventBus.off('forceUpdate', this.handleForceUpdateEvent);
          window.eventBus.off('globalForceUpdate', this.handleForceUpdateEvent);
        }
      }

      // Clean up store subscription
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }

      console.log('✅ Catalogue: Cleanup completed');
    }
  }
};
</script>
<style scoped>
/* ===== CONTENT AREA ===== */
.content-area {
  width: 100%;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  font-size: 1rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #f1f3f4;
  border-top: 2px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== GRID LAYOUTS ===== */
.subjects-grid, .levels-grid, .topics-grid {
  display: grid;
  gap: 1.5rem;
  width: 100%;
}

.subjects-grid {
  grid-template-columns: repeat(4, 1fr);
}

.levels-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.topics-grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

/* ===== SUBJECT CARD STYLES WITH ENHANCED PURPLE GLOW ===== */
.subject-card {
  background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
  border-radius: 20px;
  border: 1px solid #e9ecef;
  padding: 2.5rem 2rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.subject-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.1) 0%, 
    rgba(168, 85, 247, 0.1) 25%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(168, 85, 247, 0.1) 75%,
    rgba(139, 92, 246, 0.1) 100%);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  opacity: 0;
  transition: all 0.4s ease;
}

.subject-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(139, 92, 246, 0.1) 50%, 
    transparent 100%);
  transition: left 0.6s ease;
  z-index: 1;
}

.subject-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(139, 92, 246, 0.25),
    0 10px 30px rgba(139, 92, 246, 0.15),
    0 0 0 1px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%);
}

.subject-card:hover::before {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.6) 0%, 
    rgba(168, 85, 247, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(168, 85, 247, 0.6) 75%,
    rgba(139, 92, 246, 0.6) 100%);
  opacity: 1;
  animation: pulse-border 2s infinite;
}

.subject-card:hover::after {
  left: 100%;
}

@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.card-icon {
  font-size: 3.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 2;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.card-icon::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  opacity: 0;
  transition: all 0.3s ease;
  z-index: -1;
}

.subject-card:hover .card-icon {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.15) 0%, 
    rgba(168, 85, 247, 0.15) 100%);
  transform: scale(1.1) rotateY(5deg);
  box-shadow: 
    0 8px 25px rgba(139, 92, 246, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
}

.subject-card:hover .card-icon::before {
  opacity: 1;
  animation: rotate-border 3s linear infinite;
}

@keyframes rotate-border {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.card-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 1.5rem 0;
  text-align: center;
  line-height: 1.2;
  transition: all 0.4s ease;
  position: relative;
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  letter-spacing: -0.5px;
}

.subject-card:hover .card-title {
  color: #8b5cf6;
  transform: translateY(-2px);
  text-shadow: 
    0 2px 8px rgba(139, 92, 246, 0.3),
    0 1px 2px rgba(139, 92, 246, 0.2);
}

.card-stats {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;
}

.stat-badge {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #e9ecef;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.stat-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(139, 92, 246, 0.2) 50%, 
    transparent 100%);
  transition: left 0.5s ease;
}

.subject-card:hover .stat-badge {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.1) 0%, 
    rgba(168, 85, 247, 0.1) 100%);
  border-color: rgba(139, 92, 246, 0.3);
  color: #8b5cf6;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 4px 12px rgba(139, 92, 246, 0.2),
    0 2px 4px rgba(139, 92, 246, 0.1);
}

.subject-card:hover .stat-badge::before {
  left: 100%;
}

/* Enhanced card interaction effects */
.subject-card:active {
  transform: translateY(-8px) scale(0.98);
  transition: all 0.1s ease;
}

.subject-card:focus {
  outline: none;
  box-shadow: 
    0 25px 50px rgba(139, 92, 246, 0.25),
    0 0 0 3px rgba(139, 92, 246, 0.3);
}

/* Floating animation for idle state */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

.subject-card:not(:hover) {
  animation: float 6s ease-in-out infinite;
}

/* Gradient text effect on hover */
.subject-card:hover .card-title {
  background: linear-gradient(135deg, #8b5cf6, #a855f7, #8b5cf6);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-text 2s ease infinite;
}

@keyframes gradient-text {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Enhanced card grid for better spacing */
.subjects-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  padding: 1rem 0;
}

/* Responsive enhancements */
@media (min-width: 1200px) {
  .subjects-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1199px) {
  .subjects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .subjects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .subject-card {
    padding: 2rem 1.5rem;
    min-height: 260px;
  }
  
  .card-icon {
    font-size: 3rem;
    height: 70px;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .subject-card {
    padding: 2rem;
    min-height: 240px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .subject-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-color: #404040;
    color: #e0e0e0;
  }
  
  .subject-card:hover {
    background: linear-gradient(135deg, #2d2d2d 0%, #1a1a2e 100%);
  }
  
  .card-title {
    color: #f0f0f0;
  }
  
  .stat-badge {
    background: linear-gradient(135deg, #404040 0%, #2d2d2d 100%);
    color: #e0e0e0;
    border-color: #606060;
  }
}

/* Performance optimizations */
.subject-card {
  will-change: transform;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.card-icon {
  will-change: transform;
  backface-visibility: hidden;
}

/* ===== OTHER CARD STYLES ===== */
.level-card, .topic-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.level-card {
  cursor: pointer;
}

.level-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #8b5cf6;
}

.topic-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.level-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.level-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  border: 1px solid #e9ecef;
}

.level-header .card-title {
  text-align: left;
  margin: 0;
  flex: 1;
}

.level-description {
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  text-align: center;
}

.progress-info {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6c757d;
  text-align: center;
  font-weight: 500;
}

.card-footer {
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f3f4;
}

.access-type {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  display: inline-block;
}

.access-type.has-free {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.access-type.premium-only {
  background: #495057;
  color: white;
  border-color: #495057;
}

/* ===== TOPIC CARD SPECIFIC ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.topic-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.add-btn {
  background: #ffffff;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-btn:disabled {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
  cursor: not-allowed;
}

.add-btn:hover:not(:disabled) {
  background: #8b5cf6;
  color: white;
}

.topic-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.level-badge, .access-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.access-badge.free {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.access-badge.premium {
  background: #495057;
  color: white;
  border-color: #495057;
}

.topic-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
  justify-content: center;
  font-weight: 400;
}

.progress-section {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
}

.progress-percentage {
  font-weight: 600;
  color: #212529;
  font-size: 0.875rem;
}

.status-section {
  margin: 1rem 0;
  text-align: center;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.status-badge.in-progress {
  background: #cce7ff;
  color: #004085;
  border-color: #80c1ff;
}

.status-badge.not-started {
  background: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.75rem;
}

.btn-start {
  background: #8b5cf6;
  color: white;
}

.btn-continue {
  background: #495057;
  color: white;
}

.btn-completed {
  background: #f8f9fa;
  color: #6c757d;
  cursor: default;
}

.btn-start:hover, .btn-continue:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ===== LEVEL CLASSES ===== */
.level-beginner, .level-badge.level-beginner { 
  background: #d4edda; 
  color: #155724; 
  border-color: #c3e6cb;
}
.level-intermediate, .level-badge.level-intermediate { 
  background: #fff3cd; 
  color: #856404; 
  border-color: #ffeaa7;
}
.level-advanced, .level-badge.level-advanced { 
  background: #f8d7da; 
  color: #721c24; 
  border-color: #f1aeb5;
}

/* Level Icons */
.level-icon.level-1 { background: #d4edda; color: #155724; }
.level-icon.level-2 { background: #d4edda; color: #155724; }
.level-icon.level-3 { background: #d4edda; color: #155724; }
.level-icon.level-4 { background: #fff3cd; color: #856404; }
.level-icon.level-5 { background: #fff3cd; color: #856404; }
.level-icon.level-6 { background: #fff3cd; color: #856404; }
.level-icon.level-7 { background: #f8d7da; color: #721c24; }
.level-icon.level-8 { background: #f8d7da; color: #721c24; }
.level-icon.level-9 { background: #f8d7da; color: #721c24; }
.level-icon.level-10 { background: #f8d7da; color: #721c24; }

/* Level Badges for Numbers */
.level-badge.level-1 { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.level-badge.level-2 { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.level-badge.level-3 { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.level-badge.level-4 { background: #fff3cd; color: #856404; border-color: #ffeaa7; }
.level-badge.level-5 { background: #fff3cd; color: #856404; border-color: #ffeaa7; }
.level-badge.level-6 { background: #fff3cd; color: #856404; border-color: #ffeaa7; }/* Professional Clean Catalogue Page CSS - Thin Horizontal Filter Bar */
.catalogue-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fafbfc;
  font-family: 'Unbounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
}

/* ===== HEADER STYLES ===== */
.page-header {
  background: #ffffff;
  border-bottom: 1px solid #e1e5e9;
  padding: 1.5rem 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  margin-bottom: 1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  color: #495057;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.back-btn:hover {
  background: #e9ecef;
  color: #343a40;
  border-color: #ced4da;
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #6c757d;
  transition: all 0.2s ease;
}

.breadcrumb-item.active {
  background: #495057;
  color: white;
}

.breadcrumb-separator {
  color: #adb5bd;
  font-weight: 500;
}

.subscription-badge {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
  border: 1px solid;
}

.badge-pro { 
  background: #495057; 
  color: white; 
  border-color: #495057;
}
.badge-start { 
  background: #007bff; 
  color: white; 
  border-color: #007bff;
}
.badge-free { 
  background: #f8f9fa; 
  color: #495057; 
  border-color: #e1e5e9;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #212529;
  margin: 0;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
  padding: 0 2rem;
}

/* ===== MAIN CONTAINER ===== */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  flex: 1;
}

/* ===== COMPACT HORIZONTAL FILTER BAR ===== */
.filter-bar {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input, .filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  color: #495057;
  min-width: 180px;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
}

.search-input::placeholder {
  color: #adb5bd;
}

.checkbox-filter {
  display: flex;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
  white-space: nowrap;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  margin-right: 0.25rem;
}

.clear-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #6c757d;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.clear-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  color: #495057;
}

/* ===== CONTENT AREA ===== */
.content-area {
  width: 100%;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  font-size: 1rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #f1f3f4;
  border-top: 2px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== GRID LAYOUTS ===== */
.subjects-grid, .levels-grid, .topics-grid {
  display: grid;
  gap: 1.5rem;
  width: 100%;
}

.subjects-grid {
  grid-template-columns: repeat(4, 1fr);
  justify-items: stretch;
}

.levels-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  justify-items: stretch;
}

.topics-grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  justify-items: stretch;
}

/* ===== ENHANCED SUBJECT CARD STYLES WITH PURPLE GLOW ===== */
.subject-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  padding: 2rem 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  width: 100%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.subject-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, transparent, transparent);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  opacity: 0;
  transition: all 0.3s ease;
}

.subject-card:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 20px 40px rgba(139, 92, 246, 0.15),
    0 0 0 1px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.subject-card:hover::before {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.4));
  opacity: 1;
}

.level-card, .topic-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.level-card {
  cursor: pointer;
}

.level-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #8b5cf6;
}

.topic-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.subject-card:hover .card-icon {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  transform: scale(1.1);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.75rem 0;
  text-align: center;
  line-height: 1.3;
  transition: all 0.3s ease;
}

.subject-card:hover .card-title {
  color: #8b5cf6;
}

.card-stats {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.stat-badge {
  background: #f8f9fa;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.subject-card:hover .stat-badge {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.card-levels {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.level-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  transition: all 0.3s ease;
}

.subject-card:hover .level-tag {
  transform: translateY(-1px);
}

.card-footer {
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f3f4;
}

.access-type {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  display: inline-block;
  transition: all 0.3s ease;
}

.access-type.has-free {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.subject-card:hover .access-type.has-free {
  background: #c8e6c9;
  transform: translateY(-1px);
}

.access-type.premium-only {
  background: #495057;
  color: white;
  border-color: #495057;
}

.subject-card:hover .access-type.premium-only {
  background: #8b5cf6;
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

/* ===== LEVEL CARD SPECIFIC ===== */
.level-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.level-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  border: 1px solid #e9ecef;
}

.level-header .card-title {
  text-align: left;
  margin: 0;
  flex: 1;
}

.level-description {
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  text-align: center;
}

.progress-info {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6c757d;
  text-align: center;
  font-weight: 500;
}

/* ===== TOPIC CARD SPECIFIC ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.topic-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.add-btn {
  background: #ffffff;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-btn:disabled {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
  cursor: not-allowed;
}

.add-btn:hover:not(:disabled) {
  background: #8b5cf6;
  color: white;
}

.topic-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.level-badge, .access-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.access-badge.free {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.access-badge.premium {
  background: #495057;
  color: white;
  border-color: #495057;
}

.topic-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
  justify-content: center;
  font-weight: 400;
}

.progress-section {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
}

.progress-percentage {
  font-weight: 600;
  color: #212529;
  font-size: 0.875rem;
}

.status-section {
  margin: 1rem 0;
  text-align: center;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.status-badge.in-progress {
  background: #cce7ff;
  color: #004085;
  border-color: #80c1ff;
}

.status-badge.not-started {
  background: #f8f9fa;
  color: #6c757d;
  border-color: #e9ecef;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.75rem;
}

.btn-start {
  background: #8b5cf6;
  color: white;
}

.btn-continue {
  background: #495057;
  color: white;
}

.btn-completed {
  background: #f8f9fa;
  color: #6c757d;
  cursor: default;
}

.btn-start:hover, .btn-continue:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ===== LEVEL CLASSES ===== */
.level-beginner, .level-badge.level-beginner, .level-tag.level-beginner { 
  background: #d4edda; 
  color: #155724; 
  border-color: #c3e6cb;
}
.level-intermediate, .level-badge.level-intermediate, .level-tag.level-intermediate { 
  background: #fff3cd; 
  color: #856404; 
  border-color: #ffeaa7;
}
.level-advanced, .level-badge.level-advanced, .level-tag.level-advanced { 
  background: #f8d7da; 
  color: #721c24; 
  border-color: #f1aeb5;
}

/* Level Icons */
.level-icon.level-1 { background: #d4edda; color: #155724; }
.level-icon.level-2 { background: #d4edda; color: #155724; }
.level-icon.level-3 { background: #d4edda; color: #155724; }
.level-icon.level-4 { background: #fff3cd; color: #856404; }
.level-icon.level-5 { background: #fff3cd; color: #856404; }
.level-icon.level-6 { background: #fff3cd; color: #856404; }
.level-icon.level-7 { background: #f8d7da; color: #721c24; }
.level-icon.level-8 { background: #f8d7da; color: #721c24; }
.level-icon.level-9 { background: #f8d7da; color: #721c24; }
.level-icon.level-10 { background: #f8d7da; color: #721c24; }

/* Level Badges for Numbers */
.level-badge.level-1, .level-tag.level-1 { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.level-badge.level-2, .level-tag.level-2 { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.level-badge.level-3, .level-tag.level-3 { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.level-badge.level-4, .level-tag.level-4 { background: #fff3cd; color: #856404; border-color: #ffeaa7; }
.level-badge.level-5, .level-tag.level-5 { background: #fff3cd; color: #856404; border-color: #ffeaa7; }
.level-badge.level-6, .level-tag.level-6 { background: #fff3cd; color: #856404; border-color: #ffeaa7; }
.level-badge.level-7, .level-tag.level-7 { background: #f8d7da; color: #721c24; border-color: #f1aeb5; }
.level-badge.level-8, .level-tag.level-8 { background: #f8d7da; color: #721c24; border-color: #f1aeb5; }
.level-badge.level-9, .level-tag.level-9 { background: #f8d7da; color: #721c24; border-color: #f1aeb5; }
.level-badge.level-10, .level-tag.level-10 { background: #f8d7da; color: #721c24; border-color: #f1aeb5; }

/* ===== PROGRESS CLASSES ===== */
.progress-none { background: #e9ecef; }
.progress-low { background: #dc3545; }
.progress-medium { background: #fd7e14; }
.progress-high { background: #8b5cf6; }
.progress-completed { background: #28a745; }

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.empty-state p {
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ===== BUTTON STYLES ===== */
.btn-primary {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-primary:hover {
  background: #7c3aed;
}

.btn-secondary {
  background: #ffffff;
  color: #6c757d;
  border: 1px solid #ced4da;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #495057;
}

/* ===== MODAL STYLES ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fade-in 0.15s ease-out;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 0;
  max-width: 480px;
  width: 92%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slide-up 0.2s ease-out;
  position: relative;
  border: 1px solid #e9ecef;
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e9ecef;
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  padding-right: 2.5rem;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  border-top: 1px solid #f1f3f4;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.topic-preview {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.topic-preview h4 {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
}

.topic-preview p {
  margin: 0 0 1rem;
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.4;
}

.topic-preview .topic-stats {
  justify-content: center;
  font-size: 0.75rem;
  color: #6c757d;
}

.success-modal {
  text-align: center;
}

.success-content {
  padding: 2rem 1.5rem;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: #28a745;
}

.success-content p {
  color: #6c757d;
  margin: 0 0 1.5rem;
  line-height: 1.5;
  font-size: 0.875rem;
}

/* ===== ANIMATION KEYFRAMES ===== */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== RESPONSIVE DESIGN FOR FILTERS ===== */
@media (max-width: 1200px) {
  .filter-row {
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
  }
  
  .clear-filters {
    grid-column: 1 / -1;
    justify-self: end;
    margin-top: 1rem;
  }
  
  .subjects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .subjects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .checkbox-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1rem 0;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
    padding: 0 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .filter-sidebar {
    padding: 1rem;
  }
  
  .subjects-grid, .levels-grid, .topics-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    justify-items: stretch;
  }
  
  .subject-card, .level-card, .topic-card {
    padding: 1rem;
  }
  
  .card-icon {
    font-size: 2rem;
    height: 50px;
  }
  
  .level-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .level-header .card-title {
    text-align: center;
  }
}

@media (max-width: 640px) {
  .sidebar-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .clear-filters {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .breadcrumb-path {
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .breadcrumb-separator {
    display: none;
  }
  
  .card-title {
    font-size: 1.125rem;
  }
  
  .topic-title {
    font-size: 1rem;
  }
  
  .add-btn {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-header h3 {
    font-size: 1.125rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
    padding: 0.75rem 1rem 1rem;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
  }
}

/* ===== FOCUS STYLES FOR ACCESSIBILITY ===== */
.back-btn:focus,
.add-btn:focus,
.action-btn:focus,
.clear-filters:focus,
.modal-close:focus,
.btn-primary:focus,
.btn-secondary:focus,
.search-input:focus,
.filter-select:focus {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.subject-card:focus,
.level-card:focus {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.checkbox-item:focus-within {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
  border-radius: 6px;
}

/* ===== LOADING STATES ===== */
.add-btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.add-btn.loading::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ===== SCROLL BEHAVIOR ===== */
html {
  scroll-behavior: smooth;
}

/* ===== CUSTOM SCROLLBAR ===== */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* ===== ENHANCED HOVER EFFECTS ===== */
.stat-badge:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.level-tag:hover {
  transform: translateY(-1px);
}

/* ===== SELECTION STYLES ===== */
::selection {
  background: rgba(139, 92, 246, 0.2);
  color: #212529;
}

::-moz-selection {
  background: rgba(139, 92, 246, 0.2);
  color: #212529;
}

/* ===== HIGH CONTRAST MODE ===== */
@media (prefers-contrast: high) {
  .subject-card, .level-card, .topic-card {
    border: 2px solid #000;
  }
  
  .add-btn {
    border: 2px solid #000;
  }
  
  .modal-content {
    border: 3px solid #000;
  }
  
  .btn-primary, .btn-secondary {
    border: 2px solid #000;
  }
}

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .subject-card:hover, .level-card:hover, .topic-card:hover {
    transform: none;
  }
  
  .add-btn:hover {
    transform: none;
  }
  
  .btn-primary:hover, .btn-secondary:hover {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
  
  .modal-overlay, .modal-content {
    animation: none;
  }
}

/* ===== PRINT STYLES ===== */
@media print {
  .filter-sidebar {
    display: none;
  }
  
  .subject-card, .level-card, .topic-card {
    background: white;
    box-shadow: none;
    border: 1px solid #ccc;
    break-inside: avoid;
    margin-bottom: 1rem;
  }
  
  .add-btn, .action-btn {
    display: none;
  }
  
  .modal-overlay {
    display: none;
  }
}

/* ===== UTILITY CLASSES ===== */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
/* ===== FIXED GRID LAYOUTS WITH PROPER SPACING ===== */
.subjects-grid, .levels-grid, .topics-grid {
  display: grid;
  gap: 2rem;
  width: 100%;
  padding: 1rem 0;
  box-sizing: border-box;
}

.subjects-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  justify-items: stretch;
  align-items: start;
}

.levels-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  justify-items: stretch;
  align-items: start;
}

.topics-grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
  justify-items: stretch;
  align-items: start;
}

/* ===== ENHANCED SUBJECT CARD SPACING ===== */
.subject-card {
  background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
  border-radius: 20px;
  border: 1px solid #e9ecef;
  padding: 2rem 1.5rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 280px;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  margin: 0;
}

/* ===== LEVEL AND TOPIC CARD SPACING ===== */
.level-card, .topic-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  position: relative;
}

/* ===== RESPONSIVE GRID IMPROVEMENTS ===== */
@media (min-width: 1400px) {
  .subjects-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2.5rem;
  }
  
  .levels-grid, .topics-grid {
    gap: 2.5rem;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .subjects-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 900px) and (max-width: 1199px) {
  .subjects-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
  
  .levels-grid, .topics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 600px) and (max-width: 899px) {
  .subjects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .levels-grid, .topics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .subject-card {
    padding: 1.5rem 1.25rem;
    min-height: 250px;
  }
  
  .card-icon {
    font-size: 3rem;
    height: 70px;
    margin-bottom: 1rem;
  }
  
  .card-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .card-stats {
    margin-bottom: 1rem;
  }
}

@media (max-width: 599px) {
  .subjects-grid, .levels-grid, .topics-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0.5rem 0;
  }
  
  .subject-card {
    padding: 1.5rem;
    min-height: 220px;
  }
  
  .card-icon {
    font-size: 2.5rem;
    height: 60px;
    margin-bottom: 1rem;
  }
  
  .card-title {
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }
  
  .level-card, .topic-card {
    padding: 1.25rem;
  }
}

/* ===== CONTAINER IMPROVEMENTS ===== */
.content-area {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  flex: 1;
  box-sizing: border-box;
}

/* ===== CARD CONTENT SPACING ===== */
.card-icon {
  font-size: 3.5rem;
  text-align: center;
  margin-bottom: 1.25rem;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 2;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.card-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 1.25rem 0;
  text-align: center;
  line-height: 1.2;
  transition: all 0.4s ease;
  position: relative;
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

.card-stats {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 0;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}

.stat-badge {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #e9ecef;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

/* ===== PREVENT CARD OVERLAP ===== */
.subject-card,
.level-card,
.topic-card {
  isolation: isolate;
  contain: layout style;
}

.subject-card::before,
.subject-card::after {
  pointer-events: none;
}

/* ===== FLOATING ANIMATION FIX ===== */
@keyframes float {
  0%, 100% { 
    transform: translateY(0px);
  }
  50% { 
    transform: translateY(-2px);
  }
}

.subject-card:not(:hover) {
  animation: float 6s ease-in-out infinite;
}

.subject-card:hover {
  animation: none;
}

/* ===== ENSURE CARDS DON'T BREAK LAYOUT ===== */
.subjects-grid > *,
.levels-grid > *,
.topics-grid > * {
  min-width: 0;
  overflow: hidden;
}

/* ===== FILTER BAR SPACING ===== */
.filter-bar {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  box-sizing: border-box;
}

/* ===== MOBILE SPACING ADJUSTMENTS ===== */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .filter-bar {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .subjects-grid, .levels-grid, .topics-grid {
    gap: 1rem;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0.75rem;
  }
  
  .filter-bar {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .subject-card {
    padding: 1.25rem;
    min-height: 200px;
  }
  
  .card-icon {
    font-size: 2.25rem;
    height: 50px;
    margin-bottom: 1rem;
  }
  
  .card-title {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  
  .stat-badge {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
}
</style>