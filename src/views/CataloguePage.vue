<template>
  <div class="catalogue-page">
    <!-- Header -->
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
      <!-- Filter Sidebar -->
      <div class="filter-sidebar">
        <div class="sidebar-header">
          <h3>🔍 Фильтры</h3>
          <button @click="clearFilters" class="clear-filters">Очистить</button>
        </div>

        <!-- Search -->
        <div class="filter-group">
          <label class="filter-label">Поиск</label>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Найти..."
          />
        </div>

        <!-- Subject Filter (only when not in subjects view) -->
        <div v-if="currentView !== 'subjects'" class="filter-group">
          <label class="filter-label">Предмет</label>
          <select v-model="filterSubject" class="filter-select">
            <option value="">Все предметы</option>
            <option v-for="subject in availableSubjects" :key="subject" :value="subject">
              {{ subject }}
            </option>
          </select>
        </div>

        <!-- Level Filter (only when in topics view) -->
        <div v-if="currentView === 'topics'" class="filter-group">
          <label class="filter-label">Уровень</label>
          <select v-model="filterLevel" class="filter-select">
            <option value="">Все уровни</option>
            <option v-for="level in availableLevels" :key="level" :value="level">
              {{ level }}
            </option>
          </select>
        </div>

        <!-- Access Type Filter -->
        <div class="filter-group">
          <label class="filter-label">Доступ</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="showFree"
                class="checkbox"
              />
              <span class="checkmark"></span>
              🆓 Бесплатные
            </label>
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="showPremium"
                class="checkbox"
              />
              <span class="checkmark"></span>
              ⭐ Премиум
            </label>
          </div>
        </div>

        <!-- Progress Filter (only for topics) -->
        <div v-if="currentView === 'topics'" class="filter-group">
          <label class="filter-label">Прогресс</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="showNotStarted"
                class="checkbox"
              />
              <span class="checkmark"></span>
              ⭕ Не начато
            </label>
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="showInProgress"
                class="checkbox"
              />
              <span class="checkmark"></span>
              🔄 В процессе
            </label>
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="showCompleted"
                class="checkbox"
              />
              <span class="checkmark"></span>
              ✅ Завершено
            </label>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="stats-section">
          <h4>📊 Статистика</h4>
          <div class="stat-item">
            <span class="stat-label">Всего элементов:</span>
            <span class="stat-value">{{ currentItems.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Показано:</span>
            <span class="stat-value">{{ filteredItems.length }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="content-area">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <span>Загрузка...</span>
        </div>

        <!-- Subjects View -->
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
            <div class="card-levels">
              <span 
                v-for="level in subject.levels" 
                :key="level"
                class="level-tag"
                :class="getLevelClass(level)"
              >
                {{ level }}
              </span>
            </div>
            <div class="card-footer">
              <span class="access-type" :class="subject.hasFreeLessons ? 'has-free' : 'premium-only'">
                {{ subject.hasFreeLessons ? '🆓 Есть бесплатные' : '⭐ Только премиум' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Levels View -->
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

        <!-- Topics View -->
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

            <!-- Progress Section -->
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

            <!-- Status Badge -->
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

        <!-- Empty State -->
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

    <!-- Modals -->
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
      // Navigation state
      currentView: 'subjects', // 'subjects' | 'levels' | 'topics'
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
      
      // Filter state
      searchQuery: '',
      filterSubject: '',
      filterLevel: '',
      showFree: true,
      showPremium: true,
      showNotStarted: true,
      showInProgress: true,
      showCompleted: true,
      
      // Modal state
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedTopic: null,
      requestedTopicId: null,
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
    },

    currentItems() {
      switch (this.currentView) {
        case 'subjects': return this.subjects;
        case 'levels': return this.levels;
        case 'topics': return this.topics;
        default: return [];
      }
    },

    filteredItems() {
      switch (this.currentView) {
        case 'subjects': return this.filteredSubjects;
        case 'levels': return this.filteredLevels;
        case 'topics': return this.filteredTopics;
        default: return [];
      }
    },

    availableSubjects() {
      return [...new Set(this.lessons.map(lesson => lesson.subject).filter(Boolean))];
    },

    availableLevels() {
      return [...new Set(this.lessons.map(lesson => lesson.level).filter(Boolean))];
    },

    filteredSubjects() {
      return this.subjects.filter(subject => {
        const matchesSearch = subject.name.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesAccess = (this.showFree && subject.hasFreeLessons) || 
                             (this.showPremium && subject.hasPremiumLessons);
        return matchesSearch && matchesAccess;
      });
    },

    filteredLevels() {
      return this.levels.filter(level => {
        const matchesSearch = level.name.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesAccess = (this.showFree && level.hasFreeLessons) || 
                             (this.showPremium && level.hasPremiumLessons);
        return matchesSearch && matchesAccess;
      });
    },

    filteredTopics() {
      return this.topics.filter(topic => {
        const matchesSearch = topic.name.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesSubject = !this.filterSubject || topic.subject === this.filterSubject;
        const matchesLevel = !this.filterLevel || topic.level === this.filterLevel;
        const matchesAccess = (this.showFree && topic.type === 'free') || 
                             (this.showPremium && topic.type === 'premium');
        
        let matchesProgress = true;
        if (topic.progress !== undefined) {
          const isNotStarted = topic.progress === 0;
          const isInProgress = topic.progress > 0 && topic.progress < 100;
          const isCompleted = topic.progress === 100;
          
          matchesProgress = (this.showNotStarted && isNotStarted) ||
                           (this.showInProgress && isInProgress) ||
                           (this.showCompleted && isCompleted);
        }
        
        return matchesSearch && matchesSubject && matchesLevel && matchesAccess && matchesProgress;
      });
    }
  },

  async mounted() {
    await this.initializeComponent();
  },

  methods: {
    // ===== INITIALIZATION =====
    async initializeComponent() {
      try {
        this.lang = localStorage.getItem('lang') || 'en';
        
        const storedId = localStorage.getItem('firebaseUserId') || localStorage.getItem('userId');
        if (!storedId) {
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
      }
    },

    // ===== DATA LOADING =====
    async loadLessons() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/lessons`);
        this.lessons = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('❌ Error loading lessons:', error);
        this.lessons = [];
      }
    },

    async loadUserProgress() {
      if (!this.userId) return;
      
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        if (!token) return;

        // Try topics-progress endpoint first
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/topics-progress`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          this.userProgress = response.data || {};
          return;
        } catch (topicProgressError) {
          console.warn('⚠️ Topics-progress endpoint failed:', topicProgressError.response?.status);
        }

        // Fallback: try user progress endpoint
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/users/${this.userId}/progress`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const progressData = response.data?.data || response.data || [];
          await this.calculateTopicProgressFromLessons(progressData);
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
        this.userProgress = {};
        return;
      }

      const topicProgressMap = {};
      const topicLessons = {};
      
      // Group lessons by topicId and count totals
      this.lessons.forEach(lesson => {
        if (lesson && lesson.topicId) {
          const topicId = String(lesson.topicId);
          if (!topicLessons[topicId]) {
            topicLessons[topicId] = { total: 0, completed: 0 };
          }
          topicLessons[topicId].total++;
        }
      });

      // Count completed lessons per topic
      progressData.forEach(progress => {
        if (progress && progress.completed && progress.lessonId) {
          const lesson = this.lessons.find(l => 
            l && (String(l._id) === String(progress.lessonId._id || progress.lessonId))
          );
          
          if (lesson && lesson.topicId) {
            const topicId = String(lesson.topicId);
            if (topicLessons[topicId]) {
              topicLessons[topicId].completed++;
            }
          }
        }
      });

      // Calculate percentages
      Object.keys(topicLessons).forEach(topicId => {
        const topic = topicLessons[topicId];
        if (topic.total > 0) {
          topicProgressMap[topicId] = Math.round((topic.completed / topic.total) * 100);
        } else {
          topicProgressMap[topicId] = 0;
        }
      });

      this.userProgress = topicProgressMap;
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
          return item?.topicId ? String(item.topicId) : '';
        }).filter(id => id);
      } catch (error) {
        console.error('❌ Error loading study plan:', error);
        this.studyPlanTopics = [];
      }
    },

    // ===== DATA PROCESSING =====
    processSubjects() {
      const subjectsMap = new Map();
      
      this.lessons.forEach(lesson => {
        if (!lesson?.subject) return;
        
        const subjectName = lesson.subject;
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
        if (lesson.level) subject.levels.add(lesson.level);
        
        // Add topic to count
        if (lesson.topicId || lesson.topic) {
          const topicKey = lesson.topicId || this.getTopicName(lesson);
          subject.topics.add(topicKey);
        }
        
        subject.lessonCount++;
        
        if (lesson.type === 'free') subject.hasFreeLessons = true;
        if (lesson.type === 'premium') subject.hasPremiumLessons = true;
      });
      
      this.subjects = Array.from(subjectsMap.values()).map(subject => ({
        ...subject,
        levels: Array.from(subject.levels).sort((a, b) => {
          // Sort levels numerically if they are numbers
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return String(a).localeCompare(String(b));
        }),
        topicCount: subject.topics.size
      }));
      
      this.loading = false;
    },

    processLevels() {
      const levelsMap = new Map();
      
      const subjectLessons = this.lessons.filter(lesson => 
        lesson.subject === this.selectedSubject
      );
      
      subjectLessons.forEach(lesson => {
        if (!lesson?.level) return;
        
        const levelName = lesson.level;
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
          level.topics.add(topicKey);
        }
        level.lessonCount++;
        level.totalTime += 10; // Estimate
        
        if (lesson.type === 'free') level.hasFreeLessons = true;
        if (lesson.type === 'premium') level.hasPremiumLessons = true;
      });
      
      this.levels = Array.from(levelsMap.values()).map(level => ({
        ...level,
        topicCount: level.topics.size,
        progress: this.calculateLevelProgress(level.name)
      })).sort((a, b) => {
        // Sort levels numerically
        const aNum = parseInt(a.name);
        const bNum = parseInt(b.name);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return String(a.name).localeCompare(String(b.name));
      });
    },

    processTopics() {
      const topicsMap = new Map();
      
      const levelLessons = this.lessons.filter(lesson => 
        lesson.subject === this.selectedSubject && 
        lesson.level === this.selectedLevel
      );
      
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
            subject: lesson.subject || '',
            level: lesson.level || '',
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
        progress: this.userProgress[topic.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(topic.topicId)
      }));
    },

    calculateLevelProgress(levelName) {
      // Calculate average progress for all topics in this level
      const levelTopics = this.lessons.filter(l => 
        l.subject === this.selectedSubject && l.level === levelName
      );
      
      if (levelTopics.length === 0) return 0;
      
      let totalProgress = 0;
      let topicCount = 0;
      const seenTopics = new Set();
      
      levelTopics.forEach(lesson => {
        if (lesson.topicId && !seenTopics.has(lesson.topicId)) {
          seenTopics.add(lesson.topicId);
          totalProgress += this.userProgress[lesson.topicId] || 0;
          topicCount++;
        }
      });
      
      return topicCount > 0 ? Math.round(totalProgress / topicCount) : 0;
    },

    // ===== NAVIGATION METHODS =====
    selectSubject(subjectName) {
      this.selectedSubject = subjectName;
      this.currentView = 'levels';
      this.processLevels();
      
      // Reset filters when changing context
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
    },

    selectLevel(levelName) {
      this.selectedLevel = levelName;
      this.currentView = 'topics';
      this.processTopics();
      
      // Reset search when changing context
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
      
      // Reset search when going back
      this.searchQuery = '';
    },

    // ===== FILTER METHODS =====
    clearFilters() {
      this.searchQuery = '';
      this.filterSubject = '';
      this.filterLevel = '';
      this.showFree = true;
      this.showPremium = true;
      this.showNotStarted = true;
      this.showInProgress = true;
      this.showCompleted = true;
    },

    // ===== UTILITY METHODS =====
    getSubjectIcon(subject) {
      const icons = {
        'Mathematics': '🔢',
        'Math': '🔢',
        'Математика': '🔢',
        'English': '🇬🇧',
        'Английский': '🇬🇧',
        'Science': '🔬',
        'Наука': '🔬',
        'History': '📚',
        'История': '📚',
        'Geography': '🌍',
        'География': '🌍',
        'Programming': '💻',
        'Программирование': '💻',
        'Art': '🎨',
        'Искусство': '🎨',
        'Music': '🎵',
        'Музыка': '🎵',
        'Physics': '⚛️',
        'Физика': '⚛️',
        'Chemistry': '🧪',
        'Химия': '🧪',
        'Biology': '🧬',
        'Биология': '🧬',
        'Literature': '📖',
        'Литература': '📖',
        'Economics': '💰',
        'Экономика': '💰',
        'Philosophy': '🤔',
        'Философия': '🤔'
      };
      return icons[subject] || '📖';
    },

    getTopicName(lesson) {
      if (!lesson) return 'Без темы';
      
      try {
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
        console.error('❌ Error getting topic name:', error);
        return 'Без темы';
      }
    },

    getLevelClass(level) {
      const levelStr = String(level || '').toLowerCase();
      
      // Handle numeric levels (1-10)
      const levelNum = parseInt(levelStr);
      if (!isNaN(levelNum)) {
        return `level-${levelNum}`;
      }
      
      // Handle text levels
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
        return icons[levelNum - 1] || '📚';
      }
      
      const icons = {
        'beginner': '🌱',
        'начинающий': '🌱',
        'базовый': '🌱',
        'intermediate': '🌿',
        'средний': '🌿',
        'advanced': '🌳',
        'продвинутый': '🌳'
      };
      return icons[level.toLowerCase()] || '📚';
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
        return descriptions[levelNum] || 'Изучение предмета на данном уровне';
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
      return descriptions[level.toLowerCase()] || 'Изучение предмета на данном уровне';
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
          subject: this.selectedTopic.subject || '',
          level: this.selectedTopic.level || '',
          topic: this.selectedTopic.name || '',
          topicId: topicId,
          lessonCount: this.selectedTopic.lessonCount || 0,
          totalTime: this.selectedTopic.totalTime || 0,
          type: this.selectedTopic.type || 'free'
        };
        
        await axios.post(url, body, { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        });
        
        // Update local state
        this.selectedTopic.inStudyPlan = true;
        if (!this.studyPlanTopics.includes(this.selectedTopic.topicId)) {
          this.studyPlanTopics.push(this.selectedTopic.topicId);
        }
        
        // Update the topic in the topics array
        const topicIndex = this.topics.findIndex(t => t.topicId === this.selectedTopic.topicId);
        if (topicIndex !== -1) {
          this.topics[topicIndex].inStudyPlan = true;
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

    handlePlanUpdate(newPlan) {
      this.plan = newPlan;
    }
  }
};
</script>

<style scoped>

/* Modern Catalogue Page CSS - Improved Design */
.catalogue-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* ===== HEADER STYLES ===== */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(102, 126, 234, 0.3);
  color: #4c1d95;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #666;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.breadcrumb-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  font-size: 1.2rem;
}

.subscription-badge {
  padding: 0.5rem 1.25rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 0.85rem;
  border: 2px solid;
  backdrop-filter: blur(10px);
}

.badge-pro { 
  background: linear-gradient(135deg, #4c1d95 0%, #1e40af 100%); 
  color: white; 
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(76, 29, 149, 0.3);
}
.badge-start { 
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); 
  color: white; 
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
}
.badge-free { 
  background: rgba(255, 255, 255, 0.9); 
  color: #374151; 
  border-color: rgba(255, 255, 255, 0.5);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4c1d95 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ===== MAIN LAYOUT ===== */
.main-content {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
  padding: 2rem;
  flex: 1;
}

/* ===== IMPROVED FILTER SIDEBAR ===== */
.filter-sidebar {
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  height: fit-content;
  position: sticky;
  top: 140px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2d3748;
}

.clear-filters {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.clear-filters:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.filter-group {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-group:last-child {
  border-bottom: none;
}

.filter-label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.search-input, .filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  color: #2d3748;
  backdrop-filter: blur(10px);
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 0.9rem;
  color: #2d3748;
  position: relative;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.checkbox-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  opacity: 0;
  position: absolute;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  position: relative;
  transition: all 0.3s ease;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.checkbox:checked + .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.checkbox:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.stats-section {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: #2d3748;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.stat-label {
  color: #4a5568;
  font-weight: 500;
}

.stat-value {
  font-weight: 700;
  color: #2d3748;
  padding: 0.25rem 0.5rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  font-size: 0.85rem;
}

/* ===== CONTENT AREA ===== */
.content-area {
  flex: 1;
  min-width: 0;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== IMPROVED GRID LAYOUTS ===== */
.subjects-grid, .levels-grid, .topics-grid {
  display: grid;
  gap: 1.5rem;
}

.subjects-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.levels-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.topics-grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

/* ===== ENHANCED CARD STYLES ===== */
.subject-card, .level-card, .topic-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 1.5rem;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.subject-card::before, .level-card::before, .topic-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.subject-card, .level-card {
  cursor: pointer;
}

.subject-card:hover, .level-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.5);
}

.subject-card:hover::before, .level-card:hover::before {
  transform: scaleX(1);
}

.topic-card {
  cursor: default;
}

.topic-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.topic-card:hover::before {
  transform: scaleX(1);
}

.card-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 1rem 0;
  text-align: center;
  line-height: 1.3;
}

.card-stats {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.stat-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #4c1d95;
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(102, 126, 234, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.stat-badge:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.card-levels {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.level-tag {
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  transition: all 0.3s ease;
}

.level-tag:hover {
  transform: scale(1.05);
}

.card-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.access-type {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid;
  display: inline-block;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.access-type.has-free {
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
  border-color: rgba(34, 197, 94, 0.3);
}

.access-type.premium-only {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* ===== LEVEL CARD SPECIFIC ===== */
.level-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.level-icon {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.level-header .card-title {
  text-align: left;
  margin: 0;
  flex: 1;
}

.level-description {
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.progress-info {
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 0.9rem;
  color: #4a5568;
  text-align: center;
  font-weight: 600;
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
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.add-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border: 2px solid #667eea;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.add-btn:disabled {
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
  border-color: #22c55e;
  cursor: not-allowed;
}

.add-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.topic-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.level-badge, .access-badge {
  padding: 0.3rem 0.7rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.access-badge.free {
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
  border-color: rgba(34, 197, 94, 0.3);
}

.access-badge.premium {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.topic-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #4a5568;
  justify-content: center;
  font-weight: 500;
}

.progress-section {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
}

.progress-percentage {
  font-weight: 700;
  color: #4c1d95;
  font-size: 0.9rem;
}

.status-section {
  margin: 1rem 0;
  text-align: center;
}

.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.1);
  color: #166534;
  border-color: rgba(34, 197, 94, 0.3);
}

.status-badge.in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.3);
}

.status-badge.not-started {
  background: rgba(107, 114, 128, 0.1);
  color: #374151;
  border-color: rgba(107, 114, 128, 0.3);
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  margin-top: 1rem;
  backdrop-filter: blur(10px);
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-continue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-completed {
  background: rgba(107, 114, 128, 0.1);
  color: #4a5568;
  cursor: default;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.btn-start:hover, .btn-continue:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

/* ===== ENHANCED LEVEL CLASSES ===== */
.level-beginner, .level-badge.level-beginner, .level-tag.level-beginner { 
  background: rgba(34, 197, 94, 0.1); 
  color: #166534; 
  border-color: rgba(34, 197, 94, 0.3);
}
.level-intermediate, .level-badge.level-intermediate, .level-tag.level-intermediate { 
  background: rgba(251, 191, 36, 0.1); 
  color: #92400e; 
  border-color: rgba(251, 191, 36, 0.3);
}
.level-advanced, .level-badge.level-advanced, .level-tag.level-advanced { 
  background: rgba(239, 68, 68, 0.1); 
  color: #991b1b; 
  border-color: rgba(239, 68, 68, 0.3);
}

/* Level Icons with Enhanced Colors */
.level-icon.level-1 { background: rgba(34, 197, 94, 0.1); color: #166534; }
.level-icon.level-2 { background: rgba(34, 197, 94, 0.15); color: #15803d; }
.level-icon.level-3 { background: rgba(34, 197, 94, 0.2); color: #16a34a; }
.level-icon.level-4 { background: rgba(251, 191, 36, 0.1); color: #ca8a04; }
.level-icon.level-5 { background: rgba(251, 191, 36, 0.15); color: #d97706; }
.level-icon.level-6 { background: rgba(251, 191, 36, 0.2); color: #f59e0b; }
.level-icon.level-7 { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.level-icon.level-8 { background: rgba(236, 72, 153, 0.1); color: #be185d; }
.level-icon.level-9 { background: rgba(147, 51, 234, 0.1); color: #9333ea; }
.level-icon.level-10 { background: rgba(99, 102, 241, 0.1); color: #4338ca; }

/* Level Badges for Numbers */
.level-badge.level-1, .level-tag.level-1 { background: rgba(34, 197, 94, 0.1); color: #166534; border-color: rgba(34, 197, 94, 0.3); }
.level-badge.level-2, .level-tag.level-2 { background: rgba(34, 197, 94, 0.15); color: #15803d; border-color: rgba(34, 197, 94, 0.4); }
.level-badge.level-3, .level-tag.level-3 { background: rgba(34, 197, 94, 0.2); color: #16a34a; border-color: rgba(34, 197, 94, 0.5); }
.level-badge.level-4, .level-tag.level-4 { background: rgba(251, 191, 36, 0.1); color: #ca8a04; border-color: rgba(251, 191, 36, 0.3); }
.level-badge.level-5, .level-tag.level-5 { background: rgba(251, 191, 36, 0.15); color: #d97706; border-color: rgba(251, 191, 36, 0.4); }
.level-badge.level-6, .level-tag.level-6 { background: rgba(251, 191, 36, 0.2); color: #f59e0b; border-color: rgba(251, 191, 36, 0.5); }
.level-badge.level-7, .level-tag.level-7 { background: rgba(239, 68, 68, 0.1); color: #dc2626; border-color: rgba(239, 68, 68, 0.3); }
.level-badge.level-8, .level-tag.level-8 { background: rgba(236, 72, 153, 0.1); color: #be185d; border-color: rgba(236, 72, 153, 0.3); }
.level-badge.level-9, .level-tag.level-9 { background: rgba(147, 51, 234, 0.1); color: #9333ea; border-color: rgba(147, 51, 234, 0.3); }
.level-badge.level-10, .level-tag.level-10 { background: rgba(99, 102, 241, 0.1); color: #4338ca; border-color: rgba(99, 102, 241, 0.3); }

/* ===== PROGRESS CLASSES ===== */
.progress-none { background: rgba(107, 114, 128, 0.3); }
.progress-low { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); }
.progress-medium { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); }
.progress-high { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
.progress-completed { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.empty-state h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white;
}

.empty-state p {
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

/* ===== BUTTON STYLES ===== */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  backdrop-filter: blur(10px);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #4a5568;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 0.75rem 2rem;
  border-radius: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-size: 1rem;
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ===== MODAL STYLES ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fade-in 0.3s ease-out;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 0;
  max-width: 500px;
  width: 92%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 64px rgba(0, 0, 0, 0.3);
  animation: slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-header {
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  padding-right: 3rem;
  text-align: center;
}

.modal-body {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(102, 126, 234, 0.05);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(239, 68, 68, 0.3);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.modal-close:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.topic-preview {
  text-align: center;
  padding: 2rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
}

.topic-preview h4 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #2d3748;
}

.topic-preview p {
  margin: 0 0 1.5rem;
  color: #4a5568;
  font-size: 1rem;
  line-height: 1.6;
}

.topic-preview .topic-stats {
  justify-content: center;
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.success-modal {
  text-align: center;
}

.success-content {
  padding: 3rem 2rem;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.success-content h3 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: #667eea;
}

.success-content p {
  color: #4a5568;
  margin: 0 0 2rem;
  line-height: 1.6;
  font-size: 1.1rem;
}

/* ===== ANIMATION KEYFRAMES ===== */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1200px) {
  .main-content {
    max-width: 100%;
    padding: 1.5rem;
  }
  
  .filter-sidebar {
    width: 280px;
  }
  
  .subjects-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  
  .levels-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .topics-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 968px) {
  .main-content {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .filter-sidebar {
    width: 100%;
    position: static;
    order: 2;
  }
  
  .content-area {
    order: 1;
  }
  
  .subjects-grid, .levels-grid, .topics-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .catalogue-page {
    padding: 0;
  }
  
  .page-header {
    padding: 1.25rem 1.5rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .breadcrumb {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .page-title {
    font-size: 2.2rem;
    text-align: center;
  }
  
  .main-content {
    padding: 1.25rem;
    gap: 1.25rem;
  }
  
  .filter-sidebar {
    order: -1;
  }
  
  .sidebar-header {
    padding: 1.25rem;
  }
  
  .filter-group {
    padding: 1rem 1.25rem;
  }
  
  .subjects-grid, .levels-grid, .topics-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  
  .subject-card, .level-card, .topic-card {
    padding: 1.25rem;
  }
  
  .card-icon {
    font-size: 2.8rem;
    height: 60px;
  }
  
  .level-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .level-header .card-title {
    text-align: center;
  }
  
  .card-stats {
    justify-content: center;
  }
  
  .topic-meta {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 2rem;
  }
  
  .breadcrumb-path {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .breadcrumb-separator {
    display: none;
  }
  
  .filter-sidebar {
    border-radius: 15px;
  }
  
  .sidebar-header {
    padding: 1rem;
  }
  
  .sidebar-header h3 {
    font-size: 1rem;
  }
  
  .filter-group {
    padding: 0.875rem 1rem;
  }
  
  .subject-card, .level-card, .topic-card {
    padding: 1rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
  
  .topic-title {
    font-size: 1.1rem;
  }
  
  .add-btn {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }
  
  .empty-state {
    padding: 3rem 1.5rem;
  }
  
  .empty-icon {
    font-size: 3.5rem;
  }
  
  .empty-state h3 {
    font-size: 1.5rem;
  }
  
  .modal-content {
    width: 95%;
    border-radius: 20px;
  }
  
  .modal-header {
    padding: 1.5rem;
  }
  
  .modal-header h3 {
    font-size: 1.3rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
    padding: 1rem 1.5rem 1.5rem;
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
.btn-secondary:focus {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}

.subject-card:focus,
.level-card:focus {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
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
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ===== SCROLL BEHAVIOR ===== */
html {
  scroll-behavior: smooth;
}

.content-area {
  scroll-behavior: smooth;
}

/* ===== CUSTOM SCROLLBAR ===== */
.modal-body::-webkit-scrollbar,
.content-area::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track,
.content-area::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb,
.content-area::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover,
.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* ===== ENHANCED HOVER EFFECTS ===== */
.card-stats .stat-badge:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.card-levels .level-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.checkbox-item:hover {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
}

/* ===== SELECTION STYLES ===== */
::selection {
  background: rgba(102, 126, 234, 0.3);
  color: #2d3748;
}

::-moz-selection {
  background: rgba(102, 126, 234, 0.3);
  color: #2d3748;
}

/* ===== BACKDROP FILTER FALLBACK ===== */
@supports not (backdrop-filter: blur(20px)) {
  .modal-overlay {
    background: rgba(0, 0, 0, 0.85);
  }
  
  .modal-content,
  .filter-sidebar,
  .subject-card,
  .level-card,
  .topic-card {
    background: rgba(255, 255, 255, 0.98);
  }
  
  .page-header {
    background: rgba(255, 255, 255, 0.98);
  }
}

/* ===== HIGH CONTRAST MODE ===== */
@media (prefers-contrast: high) {
  .subject-card, .level-card, .topic-card {
    border: 3px solid #000;
  }
  
  .add-btn {
    border: 3px solid #000;
  }
  
  .modal-content {
    border: 4px solid #000;
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
  
  .progress-fill::after {
    animation: none;
  }
}

/* ===== PRINT STYLES ===== */
@media print {
  .filter-sidebar {
    display: none;
  }
  
  .main-content {
    flex-direction: column;
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
  
  .catalogue-page {
    background: white;
  }
  
  .page-header {
    background: white;
  }
}
</style>