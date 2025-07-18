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
/* Professional Clean Catalogue Page CSS - Complete with Horizontal Filters */
/* Modern Professional Catalogue Page with Glowing Effects */
.catalogue-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: #2d3748;
}

/* ===== HEADER STYLES ===== */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 2rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  margin-bottom: 1.5rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.6);
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breadcrumb-item {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #64748b;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.7);
}

.breadcrumb-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
}

.breadcrumb-separator {
  color: #94a3b8;
  font-weight: 500;
}

.subscription-badge {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid;
}

.badge-pro { 
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(255, 107, 107, 0.39);
}
.badge-start { 
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(79, 172, 254, 0.39);
}
.badge-free { 
  background: rgba(255, 255, 255, 0.9);
  color: #64748b; 
  border-color: #e2e8f0;
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
  padding: 0 2rem;
  letter-spacing: -0.025em;
}

/* ===== MAIN CONTAINER ===== */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  flex: 1;
}

/* ===== MODERN FILTER DESIGN ===== */
.filter-sidebar {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.clear-filters {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px 0 rgba(240, 147, 251, 0.39);
}

.clear-filters:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px 0 rgba(240, 147, 251, 0.6);
}

/* FILTER GRID LAYOUT */
.filter-main-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 2rem;
  align-items: end;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-input, .filter-select {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #374151;
  font-weight: 500;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 8px 25px -5px rgba(102, 126, 234, 0.3);
  background: white;
}

.search-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

/* CHECKBOX GRID */
.checkbox-filters-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 2rem;
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
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.3s ease;
  padding: 0.75rem;
  border-radius: 12px;
  position: relative;
}

.checkbox-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(4px);
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
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.checkbox:checked + .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
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

.checkbox:checked ~ span {
  color: #1f2937;
  font-weight: 600;
}

/* STATS SECTION */
.stats-section {
  padding-top: 2rem;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  margin-top: 0;
}

.stats-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  margin-right: 2rem;
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 0.875rem;
}

/* ===== CONTENT AREA ===== */
.content-area {
  width: 100%;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  font-size: 1.125rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top: 3px solid #667eea;
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
  gap: 2rem;
}

.subjects-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.levels-grid {
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
}

.topics-grid {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

/* ===== GLOWING CARD STYLES ===== */
.subject-card, .level-card, .topic-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.subject-card::before, .level-card::before, .topic-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.subject-card, .level-card {
  cursor: pointer;
}

.subject-card:hover, .level-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 25px 50px -12px rgba(102, 126, 234, 0.25),
    0 0 0 1px rgba(102, 126, 234, 0.05),
    0 0 20px rgba(102, 126, 234, 0.3),
    0 0 40px rgba(102, 126, 234, 0.2),
    0 0 80px rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.subject-card:hover::before, .level-card:hover::before {
  opacity: 1;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 20px 40px -12px rgba(102, 126, 234, 0.2),
    0 0 0 1px rgba(102, 126, 234, 0.05),
    0 0 15px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.2);
}

.card-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1.5rem;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.2));
  position: relative;
  z-index: 1;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  text-align: center;
  line-height: 1.3;
  position: relative;
  z-index: 1;
}

.card-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1.5rem 0;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.stat-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.stat-badge:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.card-levels {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin: 1.5rem 0;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.level-tag {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid;
  transition: all 0.3s ease;
}

.level-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  position: relative;
  z-index: 1;
}

.access-type {
  padding: 0.75rem 1.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid;
  display: inline-block;
  transition: all 0.3s ease;
}

.access-type.has-free {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}

.access-type.premium-only {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(237, 137, 54, 0.39);
}

.access-type:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

/* ===== LEVEL CARD SPECIFIC ===== */
.level-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.level-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.level-header .card-title {
  text-align: left;
  margin: 0;
  flex: 1;
}

.level-description {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  text-align: center;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

.progress-info {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  z-index: 1;
}

.progress-bar {
  height: 12px;
  background: rgba(226, 232, 240, 0.6);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 0.875rem;
  color: #374151;
  text-align: center;
  font-weight: 600;
}

/* ===== TOPIC CARD SPECIFIC ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.topic-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
}

.add-btn:disabled {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  cursor: not-allowed;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.6);
}

.topic-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.level-badge, .access-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid;
  transition: all 0.3s ease;
}

.access-badge.free {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}

.access-badge.premium {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(237, 137, 54, 0.39);
}

.topic-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #64748b;
  justify-content: center;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.progress-section {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  z-index: 1;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.progress-percentage {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.875rem;
}

.status-section {
  margin: 1.5rem 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.status-badge {
  padding: 0.75rem 1.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.status-badge.completed {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}

.status-badge.in-progress {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(79, 172, 254, 0.39);
}

.status-badge.not-started {
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
  border-color: rgba(148, 163, 184, 0.3);
}

.action-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
}

.btn-continue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(79, 172, 254, 0.39);
}

.btn-completed {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  cursor: default;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}

.btn-start:hover, .btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

/* ===== LEVEL CLASSES ===== */
.level-beginner, .level-badge.level-beginner, .level-tag.level-beginner { 
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}
.level-intermediate, .level-badge.level-intermediate, .level-tag.level-intermediate { 
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); 
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(237, 137, 54, 0.39);
}
.level-advanced, .level-badge.level-advanced, .level-tag.level-advanced { 
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); 
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(229, 62, 62, 0.39);
}

/* Level Icons */
.level-icon.level-1, .level-icon.level-2, .level-icon.level-3 { 
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
  color: white; 
}
.level-icon.level-4, .level-icon.level-5, .level-icon.level-6 { 
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); 
  color: white; 
}
.level-icon.level-7, .level-icon.level-8, .level-icon.level-9, .level-icon.level-10 { 
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); 
  color: white; 
}

/* Level Badges for Numbers */
.level-badge.level-1, .level-tag.level-1,
.level-badge.level-2, .level-tag.level-2,
.level-badge.level-3, .level-tag.level-3 { 
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(72, 187, 120, 0.39);
}

.level-badge.level-4, .level-tag.level-4,
.level-badge.level-5, .level-tag.level-5,
.level-badge.level-6, .level-tag.level-6 { 
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); 
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(237, 137, 54, 0.39);
}

.level-badge.level-7, .level-tag.level-7,
.level-badge.level-8, .level-tag.level-8,
.level-badge.level-9, .level-tag.level-9,
.level-badge.level-10, .level-tag.level-10 { 
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); 
  color: white; 
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(229, 62, 62, 0.39);
}

/* ===== PROGRESS CLASSES ===== */
.progress-none { 
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); 
}
.progress-low { 
  background: linear-gradient(135deg, #fc8181 0%, #f56565 100%); 
}
.progress-medium { 
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); 
}
.progress-high { 
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); 
}
.progress-completed { 
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
}

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
  opacity: 0.6;
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.2));
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #374151;
}

.empty-state p {
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 500;
}

/* ===== BUTTON STYLES ===== */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.6);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #64748b;
  border: 2px solid rgba(148, 163, 184, 0.3);
  padding: 1rem 2rem;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  backdrop-filter: blur(20px);
}

.btn-secondary:hover {
  background: white;
  border-color: #667eea;
  color: #374151;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(102, 126, 234, 0.3);
}

/* ===== MODAL STYLES ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
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
  max-width: 520px;
  width: 92%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding-right: 3rem;
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
  justify-content: flex-end;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-color: transparent;
  transform: scale(1.1);
  box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.39);
}

.topic-preview {
  text-align: center;
  padding: 2rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.topic-preview h4 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.topic-preview p {
  margin: 0 0 1.5rem;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.6;
  font-weight: 500;
}

.topic-preview .topic-stats {
  justify-content: center;
  font-size: 0.875rem;
  color: #64748b;
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
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 8px rgba(72, 187, 120, 0.3));
}

.success-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.success-content p {
  color: #64748b;
  margin: 0 0 2rem;
  line-height: 1.6;
  font-size: 1rem;
  font-weight: 500;
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
  .filter-main-row {
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }
  
  .checkbox-filters-row {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .subjects-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  
  .levels-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  .topics-grid {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 0;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1rem;
  }
  
  .page-title {
    font-size: 2.25rem;
    padding: 0 1rem;
  }
  
  .main-content {
    padding: 1.5rem;
  }
  
  .filter-sidebar {
    padding: 1.5rem;
  }
  
  .filter-main-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .checkbox-filters-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .subjects-grid, .levels-grid, .topics-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .subject-card, .level-card, .topic-card {
    padding: 1.5rem;
  }
  
  .card-icon {
    font-size: 2.5rem;
    height: 70px;
  }
  
  .level-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .level-header .card-title {
    text-align: center;
  }
  
  .level-icon {
    width: 56px;
    height: 56px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 2rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .filter-sidebar {
    padding: 1rem;
  }
  
  .sidebar-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .clear-filters {
    width: 100%;
    text-align: center;
  }
  
  .breadcrumb-path {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .breadcrumb-separator {
    display: none;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
  
  .topic-title {
    font-size: 1.125rem;
  }
  
  .add-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header {
    padding: 1.5rem;
  }
  
  .modal-header h3 {
    font-size: 1.25rem;
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
.btn-secondary:focus,
.search-input:focus,
.filter-select:focus {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}

.subject-card:focus,
.level-card:focus {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}

.checkbox-item:focus-within {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
  border-radius: 12px;
}

/* ===== LOADING STATES ===== */
.add-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* ===== SCROLL BEHAVIOR ===== */
html {
  scroll-behavior: smooth;
}

/* ===== CUSTOM SCROLLBAR ===== */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.3);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

/* ===== ENHANCED HOVER EFFECTS ===== */
.stat-badge:hover,
.level-tag:hover,
.access-badge:hover,
.status-badge:hover {
  transform: translateY(-2px) scale(1.05);
}

/* ===== SELECTION STYLES ===== */
::selection {
  background: rgba(102, 126, 234, 0.2);
  color: #1f2937;
}

::-moz-selection {
  background: rgba(102, 126, 234, 0.2);
  color: #1f2937;
}

/* ===== PRINT STYLES ===== */
@media print {
  .filter-sidebar,
  .add-btn,
  .action-btn,
  .modal-overlay {
    display: none;
  }
  
  .subject-card, .level-card, .topic-card {
    background: white !important;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
    margin-bottom: 1rem;
  }
  
  .page-title {
    color: #000 !important;
  }
}
</style>