<template>
  <div class="catalogue-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button v-if="currentView !== 'subjects'" @click="goBack" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Назад
          </button>
          <div>
            <div class="breadcrumbs">
              <span class="breadcrumb-item" :class="{ active: currentView === 'subjects' }">
                Предметы
              </span>
              <template v-if="selectedSubject">
                <svg class="breadcrumb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span class="breadcrumb-item" :class="{ active: currentView === 'levels' }">
                  {{ selectedSubject }}
                </span>
              </template>
              <template v-if="selectedLevel">
                <svg class="breadcrumb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span class="breadcrumb-item" :class="{ active: currentView === 'topics' }">
                  Уровень {{ selectedLevel }}
                </span>
              </template>
            </div>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
        </div>
        <div class="status-badge" :class="`status-${userStatus}`">
          {{ userStatusLabel }}
        </div>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="filters-section">
      <div class="filters-content">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input" 
            placeholder="Поиск курсов..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="filter-chips">
          <div class="filter-group" v-if="currentView === 'topics'">
            <label class="filter-label">Тип:</label>
            <div class="chips-row">
              <button 
                :class="['filter-chip', { active: !showFree && !showPremium }]"
                @click="showFree = false; showPremium = false"
              >
                Все
              </button>
              <button 
                :class="['filter-chip', { active: showFree }]"
                @click="showFree = !showFree; if(showFree) showPremium = false"
              >
                Free
              </button>
              <button 
                :class="['filter-chip', { active: showPremium }]"
                @click="showPremium = !showPremium; if(showPremium) showFree = false"
              >
                Premium
              </button>
            </div>
          </div>

          <div class="filter-group" v-if="currentView === 'topics'">
            <label class="filter-label">Прогресс:</label>
            <div class="chips-row">
              <button 
                :class="['filter-chip', { active: !showNotStarted && !showInProgress && !showCompleted }]"
                @click="showNotStarted = false; showInProgress = false; showCompleted = false"
              >
                Все
              </button>
              <button 
                :class="['filter-chip', { active: showNotStarted }]"
                @click="showNotStarted = !showNotStarted"
              >
                Не начаты
              </button>
              <button 
                :class="['filter-chip', { active: showInProgress }]"
                @click="showInProgress = !showInProgress"
              >
                В процессе
              </button>
              <button 
                :class="['filter-chip', { active: showCompleted }]"
                @click="showCompleted = !showCompleted"
              >
                Завершены
              </button>
            </div>
          </div>
        </div>

        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="clear-all-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Сбросить фильтры
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка каталога...</p>
    </div>

    <!-- Content -->
    <div v-else class="main-content">
      <!-- Subjects View -->
      <div v-if="currentView === 'subjects'">
        <div v-if="filteredSubjects.length" class="subjects-grid">
          <div 
            v-for="subject in filteredSubjects" 
            :key="subject.name" 
            class="subject-card"
            @click="selectSubject(subject.name)"
          >
            <div class="subject-icon">{{ getSubjectIcon(subject.name) }}</div>
            <h3 class="subject-title">{{ subject.name }}</h3>
            <div class="subject-stats">
              <span class="stat-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {{ subject.topicCount }} {{ getTopicWord(subject.topicCount) }}
              </span>
              <span class="stat-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                {{ subject.levelCount }} {{ getLevelWord(subject.levelCount) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 class="empty-title">Предметы не найдены</h3>
          <p class="empty-text">Попробуйте изменить параметры поиска</p>
        </div>
      </div>

      <!-- Levels View -->
      <div v-if="currentView === 'levels'">
        <div v-if="filteredLevels.length" class="levels-grid">
          <div 
            v-for="level in filteredLevels" 
            :key="level.name" 
            class="level-card"
            @click="selectLevel(level.name)"
          >
            <div class="level-header">
              <div class="level-icon" :class="getLevelClass(level.name)">
                {{ getLevelIcon(level.name) }}
              </div>
              <div class="level-info">
                <h3 class="level-title">Уровень {{ level.name }}</h3>
                <p class="level-description">{{ getLevelDescription(level.name) }}</p>
              </div>
            </div>
            <div class="level-meta">
              <span class="meta-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {{ level.topicCount }} {{ getTopicWord(level.topicCount) }}
              </span>
            </div>
            <div class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Прогресс</span>
                <span class="progress-value">{{ level.progress }}%</span>
              </div>
              <div class="progress-bar-wrapper">
                <div 
                  class="progress-bar"
                  :class="getProgressColor(level.progress)"
                  :style="{ width: level.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 class="empty-title">Уровни не найдены</h3>
          <p class="empty-text">Нет доступных уровней для этого предмета</p>
        </div>
      </div>

      <!-- Topics View -->
      <div v-if="currentView === 'topics'">
        <div v-if="filteredTopics.length" class="topics-grid">
          <div 
            v-for="topic in filteredTopics" 
            :key="topic.topicId" 
            class="topic-card"
          >
            <div class="topic-header">
              <span :class="['topic-type', topic.type]">{{ getTypeLabel(topic.type) }}</span>
              <button 
                class="add-btn" 
                @click.stop="addToStudyPlan(topic)" 
                :disabled="topic.inStudyPlan"
                :title="topic.inStudyPlan ? 'Уже в вашем плане' : 'Добавить в план обучения'"
              >
                <svg v-if="topic.inStudyPlan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <h3 class="topic-title">{{ topic.name }}</h3>

            <div class="topic-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {{ topic.lessonCount }} {{ getLessonWord(topic.lessonCount) }}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ topic.totalTime }} мин
              </span>
            </div>

            <div class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Ваш прогресс</span>
                <span class="progress-value">{{ topic.progress }}%</span>
              </div>
              <div class="progress-bar-wrapper">
                <div 
                  class="progress-bar"
                  :class="getProgressColor(topic.progress)"
                  :style="{ width: topic.progress + '%' }"
                ></div>
              </div>
            </div>

            <button 
              class="action-btn"
              :class="getButtonClass(topic.progress)"
              @click="handleTopicAccess(topic.topicId, topic.type)"
            >
              {{ getButtonText(topic.progress) }}
            </button>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 class="empty-title">Курсы не найдены</h3>
          <p class="empty-text">Попробуйте изменить фильтры</p>
        </div>
      </div>
    </div>

    <!-- Add to Plan Modal -->
    <transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Добавить в план обучения?</h3>
            <button class="modal-close" @click="showAddModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body" v-if="selectedTopic">
            <div class="topic-preview">
              <h4>{{ selectedTopic.name }}</h4>
              <p class="topic-desc">{{ getLevelDescription(selectedTopic.level) }}</p>
              <div class="topic-preview-stats">
                <span class="preview-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ selectedTopic.lessonCount }} уроков
                </span>
                <span class="preview-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ selectedTopic.totalTime }} мин
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showAddModal = false" class="modal-btn secondary">
              Отмена
            </button>
            <button @click="confirmAddToStudyPlan" class="modal-btn primary">
              Добавить
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Success Modal -->
    <transition name="modal">
      <div v-if="showSuccessModal" class="modal-overlay" @click="showSuccessModal = false">
        <div class="modal-container success" @click.stop>
          <div class="success-content">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 class="success-title">Добавлено в план!</h3>
            <p class="success-text">
              Курс "{{ selectedTopic?.name }}" теперь в вашем плане обучения
            </p>
            <button @click="showSuccessModal = false" class="modal-btn primary">
              Отлично!
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Paywall Modal -->
    <PaymentModal
      v-if="showPaywall"
      :user-id="userId"
      :visible="showPaywall"
      :requested-topic-id="requestedTopicId"
      @close="showPaywall = false"
      @unlocked="handlePaymentSuccess"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import {
  getAllLessons,
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

  mixins: [userStatusMixin],

  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'ru',

      // Raw data
      lessons: [],
      userProgress: {},
      studyPlanTopics: [],

      // UI state
      isLoading: true,
      currentView: 'subjects',
      selectedSubject: null,
      selectedLevel: null,

      // Processed data
      subjects: [],
      levels: [],
      topics: [],

      // Filters
      searchQuery: '',
      showFree: false,
      showPremium: false,
      showNotStarted: false,
      showInProgress: false,
      showCompleted: false,

      // Modals
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedTopic: null,
      requestedTopicId: null
    };
  },

  computed: {
    ...mapGetters('user', {
      vuexUserStatus: 'userStatus'
    }),

    userStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },

    userStatusLabel() {
      const labels = { free: 'Free', start: 'Start', pro: 'Pro' };
      return labels[this.userStatus] || 'Free';
    },

    pageTitle() {
      if (this.currentView === 'topics') {
        return `${this.selectedSubject} - Уровень ${this.selectedLevel}`;
      }
      if (this.currentView === 'levels') {
        return this.selectedSubject;
      }
      return 'Каталог курсов';
    },

    filteredSubjects() {
      return this.subjects.filter(subject => {
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          if (!subject.name.toLowerCase().includes(query)) return false;
        }
        return true;
      });
    },

    filteredLevels() {
      return this.levels;
    },

    filteredTopics() {
      return this.topics.filter(topic => {
        // Search
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          if (!topic.name.toLowerCase().includes(query)) return false;
        }

        // Type filter
        if (this.showFree && topic.type !== 'free') return false;
        if (this.showPremium && topic.type === 'free') return false;

        // Progress filter
        const progress = topic.progress || 0;
        if (this.showNotStarted && progress !== 0) return false;
        if (this.showInProgress && (progress === 0 || progress === 100)) return false;
        if (this.showCompleted && progress !== 100) return false;

        return true;
      });
    },

    hasActiveFilters() {
      return !!(
        this.searchQuery ||
        this.showFree ||
        this.showPremium ||
        this.showNotStarted ||
        this.showInProgress ||
        this.showCompleted
      );
    }
  },

  async mounted() {
    await this.initialize();
  },

  methods: {
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || 
                    localStorage.getItem('firebaseUserId');

      if (!this.userId) {
        this.$router.push('/');
        return;
      }

      await this.loadData();
    },

    async loadData() {
      try {
        this.isLoading = true;

        const [lessonsResult, progressResult, studyListResult] = await Promise.all([
          getAllLessons(),
          getUserProgress(this.userId),
          getUserStudyList(this.userId)
        ]);

        this.lessons = lessonsResult?.data || [];
        
        // Process user progress
        if (progressResult?.success && Array.isArray(progressResult.data)) {
          const progressMap = {};
          progressResult.data.forEach(p => {
            const topicId = this.extractTopicId(p.topicId);
            if (topicId) {
              if (!progressMap[topicId]) {
                progressMap[topicId] = { completed: 0, total: 0 };
              }
              progressMap[topicId].total++;
              if (p.completed) progressMap[topicId].completed++;
            }
          });
          
          Object.keys(progressMap).forEach(topicId => {
            const data = progressMap[topicId];
            this.userProgress[topicId] = data.total > 0 
              ? Math.round((data.completed / data.total) * 100)
              : 0;
          });
        }

        // Process study list
        if (studyListResult?.success && Array.isArray(studyListResult.data)) {
          this.studyPlanTopics = studyListResult.data
            .map(item => this.extractTopicId(item.topicId))
            .filter(Boolean);
        }

        this.processSubjects();
      } catch (error) {
        console.error('Error loading catalogue data:', error);
      } finally {
        this.isLoading = false;
      }
    },

    processSubjects() {
      const subjectsMap = new Map();
      
      this.lessons.forEach(lesson => {
        if (!lesson?.subject) return;
        
        const subjectName = String(lesson.subject);
        
        if (!subjectsMap.has(subjectName)) {
          subjectsMap.set(subjectName, {
            name: subjectName,
            topics: new Set(),
            levels: new Set()
          });
        }
        
        const subject = subjectsMap.get(subjectName);
        const topicId = this.extractTopicId(lesson.topicId);
        if (topicId) subject.topics.add(topicId);
        if (lesson.level) subject.levels.add(String(lesson.level));
      });

      this.subjects = Array.from(subjectsMap.values()).map(s => ({
        name: s.name,
        topicCount: s.topics.size,
        levelCount: s.levels.size
      }));
    },

    processLevels() {
      const levelsMap = new Map();
      
      this.lessons
        .filter(l => String(l.subject) === this.selectedSubject)
        .forEach(lesson => {
          const levelName = String(lesson.level || '1');
          
          if (!levelsMap.has(levelName)) {
            levelsMap.set(levelName, {
              name: levelName,
              topics: new Set()
            });
          }
          
          const topicId = this.extractTopicId(lesson.topicId);
          if (topicId) levelsMap.get(levelName).topics.add(topicId);
        });

      this.levels = Array.from(levelsMap.values())
        .map(level => ({
          name: level.name,
          topicCount: level.topics.size,
          progress: this.calculateLevelProgress(level.name)
        }))
        .sort((a, b) => Number(a.name) - Number(b.name));
    },

    processTopics() {
      const topicsMap = new Map();
      
      this.lessons
        .filter(l => 
          String(l.subject) === this.selectedSubject &&
          String(l.level) === this.selectedLevel
        )
        .forEach(lesson => {
          const topicId = this.extractTopicId(lesson.topicId);
          if (!topicId) return;

          if (!topicsMap.has(topicId)) {
            topicsMap.set(topicId, {
              topicId,
              name: this.getTopicName(lesson),
              level: String(lesson.level),
              subject: String(lesson.subject),
              lessonCount: 0,
              totalTime: 0,
              type: 'free'
            });
          }

          const topic = topicsMap.get(topicId);
          topic.lessonCount++;
          topic.totalTime += this.estimateLessonTime(lesson);
          
          if (lesson.type === 'premium' || lesson.type === 'start' || lesson.type === 'pro') {
            topic.type = 'premium';
          }
        });

      this.topics = Array.from(topicsMap.values()).map(topic => ({
        ...topic,
        progress: this.userProgress[topic.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(topic.topicId)
      }));
    },

    calculateLevelProgress(levelName) {
      const levelTopics = this.lessons
        .filter(l => 
          l.subject === this.selectedSubject &&
          String(l.level) === String(levelName)
        );

      if (levelTopics.length === 0) return 0;

      const topicIds = new Set();
      levelTopics.forEach(l => {
        const id = this.extractTopicId(l.topicId);
        if (id) topicIds.add(id);
      });

      let totalProgress = 0;
      topicIds.forEach(id => {
        totalProgress += this.userProgress[id] || 0;
      });

      return topicIds.size > 0 ? Math.round(totalProgress / topicIds.size) : 0;
    },

    selectSubject(subjectName) {
      this.selectedSubject = subjectName;
      this.currentView = 'levels';
      this.processLevels();
      this.clearFilters();
    },

    selectLevel(levelName) {
      this.selectedLevel = levelName;
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
        this.levels = [];
      }
      this.clearFilters();
    },

    clearFilters() {
      this.searchQuery = '';
      this.showFree = false;
      this.showPremium = false;
      this.showNotStarted = false;
      this.showInProgress = false;
      this.showCompleted = false;
    },

    handleTopicAccess(topicId, type) {
      const hasAccess = this.hasTopicAccess(type);
      
      if (!hasAccess) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
        return;
      }

      this.$router.push(`/topic/${topicId}/overview`);
    },

    hasTopicAccess(topicType) {
      if (topicType === 'free') return true;
      if (this.userStatus === 'pro') return true;
      if (topicType === 'premium' && this.userStatus === 'start') return true;
      return false;
    },

    addToStudyPlan(topic) {
      if (topic.inStudyPlan) return;
      this.selectedTopic = topic;
      this.showAddModal = true;
    },

    async confirmAddToStudyPlan() {
      if (!this.selectedTopic || !this.userId) return;

      try {
        const topicId = this.extractTopicId(this.selectedTopic.topicId);
        const studyListData = {
          topicId,
          topicName: this.selectedTopic.name,
          subject: this.selectedTopic.subject,
          level: this.selectedTopic.level
        };

        const result = await addToStudyList(this.userId, studyListData);

        if (result?.success) {
          this.selectedTopic.inStudyPlan = true;
          this.studyPlanTopics.push(topicId);
          
          const topicIndex = this.topics.findIndex(t => t.topicId === topicId);
          if (topicIndex !== -1) {
            this.topics[topicIndex].inStudyPlan = true;
          }

          this.showAddModal = false;
          this.showSuccessModal = true;
        } else {
          throw new Error('Failed to add to study plan');
        }
      } catch (error) {
        console.error('Error adding to study plan:', error);
        alert('Не удалось добавить курс в план обучения');
        this.showAddModal = false;
      }
    },

    handlePaymentSuccess() {
      this.showPaywall = false;
      this.$forceUpdate();
    },

    // Helper methods
    extractTopicId(topicId) {
      if (!topicId) return null;
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object') return topicId._id || topicId.id;
      return String(topicId);
    },

    getTopicName(lesson) {
      if (!lesson) return 'Без названия';
      
      if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
        return lesson.topic.trim();
      }
      
      if (lesson.topic && typeof lesson.topic === 'object') {
        if (lesson.topic[this.lang]) return String(lesson.topic[this.lang]).trim();
        if (lesson.topic.ru) return String(lesson.topic.ru).trim();
        if (lesson.topic.en) return String(lesson.topic.en).trim();
      }

      if (lesson.lessonName) return `Тема: ${lesson.lessonName}`;
      if (lesson.title) return `Тема: ${lesson.title}`;
      
      return 'Без названия';
    },

    estimateLessonTime(lesson) {
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      if (lesson.steps && Array.isArray(lesson.steps)) {
        return Math.max(5, lesson.steps.length * 2);
      }
      return 10;
    },

    getSubjectIcon(subject) {
      const icons = {
        'Математика': '🔢',
        'Английский': '🇬🇧',
        'Русский': '📝',
        'Наука': '🔬',
        'История': '📚',
        'География': '🌍',
        'Программирование': '💻',
        'Искусство': '🎨',
        'Музыка': '🎵',
        'Физика': '⚛️',
        'Химия': '🧪',
        'Биология': '🧬',
        'Литература': '📖',
        'Экономика': '💰',
        'Философия': '🤔'
      };
      return icons[String(subject)] || '📖';
    },

    getLevelClass(level) {
      const levelNum = parseInt(level);
      if (levelNum <= 3) return 'level-beginner';
      if (levelNum <= 6) return 'level-intermediate';
      return 'level-advanced';
    },

    getLevelIcon(level) {
      const icons = ['🌱', '🌿', '🍃', '🌳', '🌲', '🏔️', '⭐', '💎', '👑', '🏆'];
      const levelNum = parseInt(level) - 1;
      return icons[Math.min(levelNum, icons.length - 1)] || '📚';
    },

    getLevelDescription(level) {
      const descriptions = {
        1: 'Начальный - Основные концепции',
        2: 'Элементарный - Простые упражнения',
        3: 'Базовый - Основные навыки',
        4: 'Средний - Развитие способностей',
        5: 'Продвинутый - Практическое применение',
        6: 'Профессиональный - Углубленное изучение',
        7: 'Экспертный - Сложные концепции',
        8: 'Мастерский - Высокий уровень навыков',
        9: 'Виртуозный - Профессиональное мастерство',
        10: 'Совершенный - Полное владение'
      };
      return descriptions[parseInt(level)] || `Уровень ${level}`;
    },

    getProgressColor(progress) {
      if (progress >= 80) return 'high';
      if (progress >= 50) return 'medium';
      if (progress >= 30) return 'low';
      return 'very-low';
    },

    getButtonClass(progress) {
      if (progress === 100) return 'completed';
      if (progress > 0) return 'continue';
      return 'start';
    },

    getButtonText(progress) {
      if (progress === 100) return 'Завершено';
      if (progress > 0) return 'Продолжить';
      return 'Начать';
    },

    getTypeLabel(type) {
      const labels = { free: 'Free', premium: 'Start', pro: 'Pro' };
      return labels[type] || 'Free';
    },

    getTopicWord(count) {
      if (count % 10 === 1 && count % 100 !== 11) return 'тема';
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'темы';
      return 'тем';
    },

    getLevelWord(count) {
      if (count % 10 === 1 && count % 100 !== 11) return 'уровень';
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'уровня';
      return 'уровней';
    },

    getLessonWord(count) {
      if (count % 10 === 1 && count % 100 !== 11) return 'урок';
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'урока';
      return 'уроков';
    }
  }
};
</script>

<style scoped>
.catalogue-page {
  min-height: 100vh;
  background: #fafafa;
  padding-bottom: 2rem;
}

/* Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.back-btn svg {
  width: 1rem;
  height: 1rem;
}

.back-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.breadcrumb-item {
  font-size: 0.8125rem;
  color: #9ca3af;
  transition: color 0.2s;
}

.breadcrumb-item.active {
  color: #a855f7;
  font-weight: 600;
}

.breadcrumb-arrow {
  width: 0.875rem;
  height: 0.875rem;
  color: #d1d5db;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.status-badge.status-free {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.status-start {
  background: #faf5ff;
  color: #a855f7;
}

.status-badge.status-pro {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: white;
}

/* Filters */
.filters-section {
  max-width: 1400px;
  margin: 0 auto 2rem;
  padding: 0 2rem;
}

.filters-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  transition: all 0.2s;
  background: #fafafa;
}

.search-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  background: white;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.clear-search-btn svg {
  width: 1rem;
  height: 1rem;
}

.clear-search-btn:hover {
  background: #d1d5db;
  color: #111827;
}

.filter-chips {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chips-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border: 1.5px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: #a855f7;
  color: #a855f7;
  background: #faf5ff;
}

.filter-chip.active {
  background: #a855f7;
  border-color: #a855f7;
  color: white;
}

.clear-all-btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border: 1.5px solid #fca5a5;
  background: #fef2f2;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn svg {
  width: 1rem;
  height: 1rem;
}

.clear-all-btn:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 400px;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #f3f4f6;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.empty-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Subject Cards */
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.subject-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.subject-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
  transform: translateY(-2px);
}

.subject-icon {
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.subject-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.subject-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.stat-item svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* Level Cards */
.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.level-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.level-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
  transform: translateY(-2px);
}

.level-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.level-icon.level-beginner {
  background: #dcfce7;
  color: #10b981;
}

.level-icon.level-intermediate {
  background: #fef3c7;
  color: #f59e0b;
}

.level-icon.level-advanced {
  background: #fee2e2;
  color: #ef4444;
}

.level-info {
  flex: 1;
  min-width: 0;
}

.level-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.level-description {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
}

.level-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meta-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #6b7280;
}

.meta-badge svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.topic-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.topic-type {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.topic-type.free {
  background: #f3f4f6;
  color: #6b7280;
}

.topic-type.premium {
  background: #faf5ff;
  color: #a855f7;
}

.topic-type.pro {
  background: linear-gradient(to right, #faf5ff, #fce7f3);
  color: #a855f7;
}

.add-btn {
  width: 2rem;
  height: 2rem;
  border: 1.5px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  flex-shrink: 0;
}

.add-btn svg {
  width: 1rem;
  height: 1rem;
}

.add-btn:hover:not(:disabled) {
  border-color: #a855f7;
  background: #faf5ff;
  color: #a855f7;
}

.add-btn:disabled {
  background: #dcfce7;
  border-color: #86efac;
  color: #10b981;
  cursor: not-allowed;
}

.topic-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.4;
}

.topic-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.meta-item svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* Progress */
.progress-section {
  margin-top: auto;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
}

.progress-label {
  color: #6b7280;
  font-weight: 500;
}

.progress-value {
  color: #111827;
  font-weight: 600;
}

.progress-bar-wrapper {
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-bar.high {
  background: linear-gradient(to right, #10b981, #059669);
}

.progress-bar.medium {
  background: linear-gradient(to right, #3b82f6, #2563eb);
}

.progress-bar.low {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.progress-bar.very-low {
  background: linear-gradient(to right, #ef4444, #dc2626);
}

/* Action Button */
.action-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.start {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}

.action-btn.start:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.action-btn.continue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.action-btn.continue:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn.completed {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 28rem;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f3f4f6;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.modal-close {
  width: 2rem;
  height: 2rem;
  border: none;
  background: #f9fafb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close svg {
  width: 1.125rem;
  height: 1.125rem;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
}

.topic-preview {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
}

.topic-preview h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.topic-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.topic-preview-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.preview-stat svg {
  width: 0.875rem;
  height: 0.875rem;
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.modal-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.modal-btn.secondary {
  background: white;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.modal-btn.secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.modal-btn.primary {
  background: #a855f7;
  color: white;
}

.modal-btn.primary:hover {
  background: #9333ea;
}

/* Success Modal */
.modal-container.success {
  max-width: 24rem;
}

.success-content {
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  width: 4rem;
  height: 4rem;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}

.success-icon svg {
  width: 2rem;
  height: 2rem;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #10b981;
  margin: 0;
}

.success-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.6;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    padding: 1rem 0;
  }

  .header-content {
    padding: 0 1.5rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .filters-section,
  .main-content {
    padding: 0 1.5rem;
  }

  .filters-content {
    padding: 1.25rem;
  }

  .filter-group {
    gap: 0.5rem;
  }

  .filter-chip {
    padding: 0.4375rem 0.875rem;
    font-size: 0.8125rem;
  }

  .subjects-grid,
  .levels-grid,
  .topics-grid {
    grid-template-columns: 1fr;
  }

  .subject-card {
    padding: 1.5rem;
  }

  .subject-icon {
    width: 4rem;
    height: 4rem;
    font-size: 2rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .catalogue-page {
    padding-bottom: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content {
    padding: 0 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .filters-section,
  .main-content {
    padding: 0 1rem;
  }

  .back-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }

  .status-badge {
    padding: 0.375rem 0.75rem;
  }
}

/* Focus States */
.back-btn:focus,
.search-input:focus,
.filter-chip:focus,
.clear-all-btn:focus,
.add-btn:focus,
.action-btn:focus,
.modal-close:focus,
.modal-btn:focus {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .catalogue-page {
    background: #111827;
  }

  .page-header {
    background: #1f2937;
    border-bottom-color: #374151;
  }

  .back-btn {
    background: #374151;
    border-color: #4b5563;
    color: #9ca3af;
  }

  .back-btn:hover {
    background: #4b5563;
    color: #f9fafb;
  }

  .page-title,
  .breadcrumb-item.active {
    color: #f9fafb;
  }

  .breadcrumb-item {
    color: #6b7280;
  }

  .filters-content,
  .subject-card,
  .level-card,
  .topic-card,
  .modal-container {
    background: #1f2937;
    border-color: #374151;
  }

  .search-input {
    background: #111827;
    border-color: #374151;
    color: #f9fafb;
  }

  .search-input:focus {
    background: #1f2937;
  }

  .filter-chip {
    background: #111827;
    border-color: #374151;
    color: #9ca3af;
  }

  .filter-chip:hover {
    background: #1f2937;
  }

  .subject-title,
  .level-title,
  .topic-title,
  .modal-title,
  .empty-title {
    color: #f9fafb;
  }

  .level-description,
  .empty-text,
  .stat-item,
  .meta-item,
  .progress-label,
  .topic-desc {
    color: #9ca3af;
  }

  .progress-value {
    color: #f9fafb;
  }

  .progress-bar-wrapper {
    background: #374151;
  }

  .topic-preview {
    background: #111827;
    border-color: #374151;
  }

  .modal-close {
    background: #374151;
    color: #9ca3af;
  }

  .modal-close:hover {
    background: #4b5563;
    color: #f9fafb;
  }

  .modal-header {
    border-bottom-color: #374151;
  }

  .meta-badge {
    background: #111827;
    border-color: #374151;
    color: #9ca3af;
  }
}
</style>