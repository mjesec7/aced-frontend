<template>
  <div class="catalogue-page" :key="componentKey">
    <header class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <button v-if="currentView !== 'subjects'" @click="goBack" class="back-btn">
            &larr; Back
          </button>
          <div class="breadcrumb-path">
            <span class="breadcrumb-item" :class="{ active: currentView === 'subjects' }">
              Subjects
            </span>
            <template v-if="selectedSubject">
              <span class="breadcrumb-separator">&gt;</span>
              <span class="breadcrumb-item" :class="{ active: currentView === 'levels' }">
                {{ selectedSubject }}
              </span>
            </template>
            <template v-if="selectedLevel">
              <span class="breadcrumb-separator">&gt;</span>
              <span class="breadcrumb-item" :class="{ active: currentView === 'topics' }">
                Level {{ selectedLevel }}
              </span>
            </template>
          </div>
        </div>
        <div class="subscription-badge" :class="`badge-${userStatus}`">
          {{ userStatus }} Plan
        </div>
      </div>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </header>

    <main class="main-content">
      <div class="filter-bar">
        <div class="filter-row">
          <input type="text" v-model="searchQuery" placeholder="🔍 Search catalogue..." class="search-input" />
          <select v-model="filterSubject" class="filter-select" v-if="currentView === 'subjects'">
            <option value="">All Subjects</option>
            <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">{{ subject }}</option>
          </select>
          <select v-model="filterLevel" class="filter-select" v-if="currentView !== 'subjects'">
            <option value="">All Levels</option>
            <option v-for="level in uniqueLevels" :key="level" :value="level">Level {{ level }}</option>
          </select>
          <button @click="clearFilters" class="clear-btn">Clear Filters</button>
        </div>
        <div class="filter-row" style="margin-top: 1rem; border-top: 1px solid #f1f3f4; padding-top: 1rem;">
          <div class="checkbox-group">
            <label class="checkbox-label"><input type="checkbox" v-model="showFree"> Free</label>
            <label class="checkbox-label"><input type="checkbox" v-model="showPremium"> Premium</label>
          </div>
          <div class="checkbox-group" style="margin-left: 1rem; border-left: 1px solid #e9ecef; padding-left: 1rem;">
            <label class="checkbox-label"><input type="checkbox" v-model="showNotStarted"> Not Started</label>
            <label class="checkbox-label"><input type="checkbox" v-model="showInProgress"> In Progress</label>
            <label class="checkbox-label"><input type="checkbox" v-model="showCompleted"> Completed</label>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading catalogue...</p>
      </div>

      <div v-else>
        <div v-if="currentView === 'subjects'">
          <div v-if="filteredSubjects.length" class="subjects-grid">
            <div v-for="subject in filteredSubjects" :key="subject.name" class="subject-card" @click="selectSubject(subject.name)">
              <div class="card-icon">{{ getSubjectIcon(subject.name) }}</div>
              <h2 class="card-title">{{ subject.name }}</h2>
              <div class="card-stats">
                <span class="stat-badge">{{ subject.topicCount }} topics</span>
                <span class="stat-badge">{{ subject.levelCount }} levels</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🤷</div>
            <h3>No Subjects Found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        </div>

        <div v-if="currentView === 'levels'">
          <div v-if="filteredLevels.length" class="levels-grid">
            <div v-for="level in filteredLevels" :key="level.name" class="level-card" @click="selectLevel(level.name)">
              <div class="level-header">
                <div class="level-icon" :class="getLevelClass(level.name)">{{ getLevelIcon(level.name) }}</div>
                <div class="level-info">
                  <h3 class="level-title">Level {{ level.name }}</h3>
                  <p class="level-description">{{ getLevelDescription(level.name) }}</p>
                </div>
              </div>
              <div class="level-stats"><span class="stat-item"><span class="stat-icon">📚</span>{{ level.topicCount }} topics</span></div>
              <div class="progress-container">
                <div class="progress-header">
                  <span class="progress-label">Level Progress</span>
                  <span class="progress-value">{{ level.progress }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :class="getProgressClass(level.progress)" :style="{ width: level.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🤷</div>
            <h3>No Levels Found</h3>
            <p>No levels match your current filter settings.</p>
          </div>
        </div>

        <div v-if="currentView === 'topics'">
          <div v-if="filteredTopics.length" class="topics-grid">
            <div v-for="topic in filteredTopics" :key="topic.topicId" class="topic-card">
              <div class="topic-header">
                <h3 class="topic-title">{{ topic.name }}</h3>
                <button class="add-btn" @click="addToStudyPlan(topic)" :disabled="topic.inStudyPlan" :title="topic.inStudyPlan ? 'Already in your plan' : 'Add to study plan'">
                  {{ topic.inStudyPlan ? '✓' : '+' }}
                </button>
              </div>
              <div class="topic-meta">
                <span class="access-badge" :class="topic.type">{{ topic.type }}</span>
              </div>
              <div class="topic-stats">
                <span class="stat-item"><span class="stat-icon">📄</span>{{ topic.lessonCount }} lessons</span>
                <span class="stat-item"><span class="stat-icon">🕒</span>{{ topic.totalTime }} min</span>
              </div>
              <div class="progress-container">
                <div class="progress-header">
                  <span class="progress-label">Your Progress</span>
                  <span class="progress-value">{{ topic.progress }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :class="getProgressClass(topic.progress)" :style="{ width: topic.progress + '%' }"></div>
                </div>
              </div>
              <button class="action-btn" :class="getButtonClass(topic.progress)" @click="handleTopicAccess(topic.topicId, topic.type)">
                {{ getButtonText(topic.progress) }}
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🤷</div>
            <h3>No Topics Found</h3>
            <p>No topics match your current filter settings.</p>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <button @click="showAddModal = false" class="modal-close">&times;</button>
        <div class="modal-header"><h3>Add to Study Plan?</h3></div>
        <div class="modal-body">
          <div class="topic-preview" v-if="selectedTopic">
            <h4>{{ selectedTopic.name }}</h4>
            <p>{{ getLevelDescription(selectedTopic.level) }}</p>
            <div class="topic-stats">
              <span class="stat-item">📄 {{ selectedTopic.lessonCount }} lessons</span>
              <span class="stat-item">🕒 {{ selectedTopic.totalTime }} min</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddModal = false" class="btn-secondary">Cancel</button>
          <button @click="confirmAddToStudyPlan" class="btn-primary">Confirm</button>
        </div>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="modal-content success-modal">
        <div class="success-content">
          <div class="success-icon">🎉</div>
          <h3>Added to Plan!</h3>
          <p>"{{ selectedTopic.name }}" is now in your study plan. Keep up the great work!</p>
          <button @click="showSuccessModal = false" class="btn-primary">Got it!</button>
        </div>
      </div>
    </div>
    
    <div v-if="showPaywall" class="modal-overlay" @click.self="showPaywall = false">
      <div class="modal-content">
        <button @click="showPaywall = false" class="modal-close">&times;</button>
        <div class="modal-header"><h3>Upgrade Required</h3></div>
        <div class="modal-body" style="text-align: center;">
          <p>This topic is part of our premium content. Please upgrade your plan to access it.</p>
          <button @click="showPaywall = false" class="btn-primary" style="margin-top: 1rem;">View Plans</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Mock API functions - replace with your actual API calls
const fetchLessonsFromAPI = () => Promise.resolve([]); 
const fetchUserProgressFromAPI = () => Promise.resolve({});
const fetchStudyPlanFromAPI = () => Promise.resolve([]);
const addToStudyList = (userId, data) => Promise.resolve({ success: true, data });

export default {
  name: 'CataloguePage',
  
  // =======================
  // Component State
  // =======================
  data() {
    return {
      // Raw data from API
      lessons: [],
      userProgress: {},
      studyPlanTopics: [],
      
      // UI State
      isLoading: true,
      currentView: 'subjects', // 'subjects', 'levels', 'topics'
      selectedSubject: null,
      selectedLevel: null,
      
      // Processed data for display
      subjects: [],
      levels: [],
      topics: [],
      
      // Filters
      searchQuery: '',
      filterSubject: '',
      filterLevel: '',
      showFree: false,
      showPremium: false,
      showNotStarted: false,
      showInProgress: false,
      showCompleted: false,

      // Modals and interactivity
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedTopic: null,
      requestedTopicId: null,

      // Reactivity and event listeners
      componentKey: 0,
      eventCleanupFunctions: [],
      storeUnsubscribe: null,
      
      // Mock user data (replace with actual Vuex/Pinia state)
      userId: 'user123', 
      lang: 'en', // 'en' or 'ru'
    };
  },
  
  // =======================
  // Computed Properties
  // =======================
  computed: {
    isPremiumUser() {
      // Replace with your actual state management (Vuex/Pinia)
      const status = /* this.$store.getters.userStatus || */ localStorage.getItem('userStatus') || 'free';
      return status === 'pro' || status === 'premium';
    },

    userStatus() {
      return this.isPremiumUser ? 'premium' : 'free';
    },

    pageTitle() {
      if (this.currentView === 'topics') return `Topics for ${this.selectedSubject} - Level ${this.selectedLevel}`;
      if (this.currentView === 'levels') return `Levels for ${this.selectedSubject}`;
      return 'Course Catalogue';
    },
    
    uniqueSubjects() {
      return this.subjects.map(s => s.name).sort();
    },
    
    uniqueLevels() {
      const allLevels = this.lessons.filter(l => this.selectedSubject ? l.subject === this.selectedSubject : true)
                                   .map(l => l.level);
      return [...new Set(allLevels)].sort((a, b) => a - b);
    },

    filteredSubjects() {
      return this.subjects.filter(subject => {
        const searchMatch = !this.searchQuery || subject.name.toLowerCase().includes(this.searchQuery.toLowerCase());
        const premiumMatch = (!this.showFree && !this.showPremium) || (this.showFree && !subject.hasPremium) || (this.showPremium && subject.hasPremium);
        return searchMatch && premiumMatch;
      });
    },
    
    filteredLevels() {
      return this.levels.filter(level => {
        return !this.filterLevel || String(level.name) === String(this.filterLevel);
      });
    },

    filteredTopics() {
      return this.topics.filter(topic => {
        const searchMatch = !this.searchQuery || topic.name.toLowerCase().includes(this.searchQuery.toLowerCase());
        const levelMatch = !this.filterLevel || String(topic.level) === String(this.filterLevel);
        const typeMatch = (!this.showFree && !this.showPremium) || (this.showFree && topic.type === 'free') || (this.showPremium && (topic.type === 'premium' || topic.type === 'pro'));
        const progress = topic.progress || 0;
        const progressMatch = (!this.showNotStarted && !this.showInProgress && !this.showCompleted) ||
          (this.showNotStarted && progress === 0) ||
          (this.showInProgress && progress > 0 && progress < 100) ||
          (this.showCompleted && progress === 100);

        return searchMatch && levelMatch && typeMatch && progressMatch;
      });
    }
  },

  // =======================
  // Lifecycle Hooks
  // =======================
  async mounted() {
    this.isLoading = true;
    try {
      const [lessonsData, progressData, planData] = await Promise.all([
        fetchLessonsFromAPI(),
        fetchUserProgressFromAPI(),
        fetchStudyPlanFromAPI()
      ]);
      
      this.lessons = lessonsData || [];
      this.userProgress = progressData || {};
      this.studyPlanTopics = (planData || []).map(item => this.extractTopicId(item.topicId));
      this.processSubjects();
    } catch (error) {
      this.showErrorMessage("Failed to load course data.");
      console.error("❌ Data fetching error:", error);
    } finally {
      this.isLoading = false;
    }
    this.setupEventListeners();
  },

  beforeUnmount() {
    this.cleanup();
  },

  // =======================
  // Methods
  // =======================
  methods: {
    // Data Processing
    processSubjects() {
      if (!Array.isArray(this.lessons)) return;
      const subjectsMap = new Map();
      this.lessons.forEach(lesson => {
        if (!lesson || !lesson.subject) return;
        const subjectName = String(lesson.subject);
        if (!subjectsMap.has(subjectName)) {
          subjectsMap.set(subjectName, {
            name: subjectName,
            topicCount: 0,
            levelCount: 0,
            hasPremium: false,
            _topics: new Set(),
            _levels: new Set()
          });
        }
        const subject = subjectsMap.get(subjectName);
        if (lesson.topicId) subject._topics.add(this.extractTopicId(lesson.topicId));
        if (lesson.level) subject._levels.add(String(lesson.level));
        if (lesson.type === 'premium' || lesson.type === 'pro') subject.hasPremium = true;
      });
      this.subjects = Array.from(subjectsMap.values()).map(s => ({
        ...s,
        topicCount: s._topics.size,
        levelCount: s._levels.size,
      }));
    },
    
    processLevels() {
      if (!this.selectedSubject || !Array.isArray(this.lessons)) return;
      const levelsMap = new Map();
      this.lessons.filter(l => l && String(l.subject) === this.selectedSubject).forEach(lesson => {
        const levelName = String(lesson.level || '1');
        if (!levelsMap.has(levelName)) {
          levelsMap.set(levelName, { name: levelName, _topics: new Set() });
        }
        if (lesson.topicId) levelsMap.get(levelName)._topics.add(this.extractTopicId(lesson.topicId));
      });
      this.levels = Array.from(levelsMap.values()).map(level => ({
        ...level,
        topicCount: level._topics.size,
        progress: this.calculateLevelProgress(level.name)
      })).sort((a,b) => a.name - b.name);
    },

    processTopics() {
      if (!this.selectedSubject || !this.selectedLevel || !Array.isArray(this.lessons)) return;
      const topicsMap = new Map();
      const lessonsForLevel = this.lessons.filter(l => l && String(l.subject) === this.selectedSubject && String(l.level) === this.selectedLevel);
      lessonsForLevel.forEach(lesson => {
        if (!lesson || !lesson.topicId) return;
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;
        if (!topicsMap.has(topicId)) {
          topicsMap.set(topicId, {
            topicId: topicId,
            name: this.getTopicName(lesson),
            level: String(lesson.level),
            subject: String(lesson.subject),
            lessonCount: 0, totalTime: 0, type: 'free', lessons: []
          });
        }
        const entry = topicsMap.get(topicId);
        entry.lessonCount++;
        entry.totalTime += this.estimateLessonTime(lesson);
        if (lesson.type === 'premium' || lesson.type === 'start' || lesson.type === 'pro') {
          entry.type = 'premium';
        }
      });
      this.topics = Array.from(topicsMap.values()).map(topic => ({
        ...topic,
        progress: Number(this.userProgress[topic.topicId]) || 0,
        inStudyPlan: this.studyPlanTopics.includes(topic.topicId)
      }));
    },

    calculateLevelProgress(levelName) {
      if (!this.selectedSubject || !levelName || !Array.isArray(this.lessons)) return 0;
      const levelTopics = this.lessons.filter(l => l && l.subject === this.selectedSubject && String(l.level) === String(levelName));
      if (levelTopics.length === 0) return 0;
      let totalProgress = 0;
      const seenTopics = new Set();
      levelTopics.forEach(lesson => {
        const topicId = this.extractTopicId(lesson.topicId);
        if (topicId && !seenTopics.has(topicId)) {
          seenTopics.add(topicId);
          totalProgress += Number(this.userProgress[topicId]) || 0;
        }
      });
      return seenTopics.size > 0 ? Math.round(totalProgress / seenTopics.size) : 0;
    },

    // UI Navigation & Actions
    selectSubject(subjectName) {
      this.selectedSubject = String(subjectName);
      this.currentView = 'levels';
      this.processLevels();
      this.searchQuery = '';
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
        this.levels = [];
      }
      this.searchQuery = '';
    },

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
    
    // UI Helpers
    getSubjectIcon(subject) {
      const subjectStr = String(subject || '');
      const icons = {
        'Mathematics': '🔢', 'Math': '🔢', 'Математика': '🔢', 'English': '🇬🇧', 'Английский': '🇬🇧',
        'Science': '🔬', 'Наука': '🔬', 'History': '📚', 'История': '📚', 'Geography': '🌍', 'География': '🌍',
        'Programming': '💻', 'Программирование': '💻', 'Art': '🎨', 'Искусство': '🎨', 'Music': '🎵', 'Музыка': '🎵',
        'Physics': '⚛️', 'Физика': '⚛️', 'Chemistry': '🧪', 'Химия': '🧪', 'Biology': '🧬', 'Биология': '🧬',
        'Literature': '📖', 'Литература': '📖', 'Economics': '💰', 'Экономика': '💰', 'Philosophy': '🤔', 'Философия': '🤔'
      };
      return icons[subjectStr] || '📖';
    },

    extractTopicId(topicId) {
      if (!topicId) return null;
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object' && topicId !== null) {
        return topicId._id || topicId.id;
      }
      return String(topicId);
    },

    getTopicName(lesson) {
      if (!lesson) return 'Unnamed Topic';
      try {
        if (typeof lesson.topic === 'string' && lesson.topic.trim()) return lesson.topic.trim();
        if (lesson.topic && typeof lesson.topic === 'object' && lesson.topic !== null) {
          if (lesson.topic[this.lang] && typeof lesson.topic[this.lang] === 'string') return String(lesson.topic[this.lang]).trim();
          if (lesson.topic.en && typeof lesson.topic.en === 'string') return String(lesson.topic.en).trim();
          const anyLangTopic = Object.values(lesson.topic).find(val => typeof val === 'string' && val.trim());
          if (anyLangTopic) return anyLangTopic.trim();
        }
        if (lesson.translations && lesson.translations[this.lang] && lesson.translations[this.lang].topic) return String(lesson.translations[this.lang].topic).trim();
        if (lesson.lessonName) return `Topic: ${String(lesson.lessonName).trim()}`;
        if (lesson.title) return `Topic: ${String(lesson.title).trim()}`;
        return 'Unnamed Topic';
      } catch (error) {
        console.error('❌ Error getting topic name:', error);
        return 'Topic Name Error';
      }
    },

    getLevelClass(level) {
      const levelNum = parseInt(level);
      if (isNaN(levelNum)) return 'level-beginner';
      if (levelNum <= 3) return 'level-beginner';
      if (levelNum <= 6) return 'level-intermediate';
      return 'level-advanced';
    },

    getLevelIcon(level) {
      const levelNum = parseInt(level);
      if (isNaN(levelNum)) return '📚';
      const icons = ['🌱', '🌿', '🍃', '🌳', '🌲', '🏔️', '⭐', '💎', '👑', '🏆'];
      return icons[Math.min(levelNum - 1, icons.length - 1)] || '📚';
    },

    getLevelDescription(level) {
      const levelNum = parseInt(level);
      if (isNaN(levelNum)) return 'Basic Level';
      const descriptions = {
        1: 'Beginner - Foundational concepts', 2: 'Elementary - Simple exercises', 3: 'Novice - Basic skills',
        4: 'Intermediate - Developing abilities', 5: 'Skilled - Practical application', 6: 'Proficient - In-depth study',
        7: 'Advanced - Complex concepts', 8: 'Expert - High-level skills', 9: 'Master - Professional mastery',
        10: 'Virtuoso - Complete command'
      };
      return descriptions[levelNum] || `Level ${levelNum}`;
    },

    getProgressClass(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return 'progress-completed';
      if (prog >= 70) return 'progress-high';
      if (prog >= 30) return 'progress-medium';
      if (prog > 0) return 'progress-low';
      return 'progress-none';
    },

    getButtonClass(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return 'btn-completed';
      if (prog > 0) return 'btn-continue';
      return 'btn-start';
    },

    getButtonText(progress) {
      const prog = Number(progress) || 0;
      if (prog === 100) return '✅ Completed';
      if (prog > 0) return '▶️ Continue';
      return '🚀 Start';
    },

    estimateLessonTime(lesson) {
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime);
      if (lesson.duration) return parseInt(lesson.duration);
      if (lesson.steps && Array.isArray(lesson.steps)) return Math.max(5, lesson.steps.length * 2);
      return 10;
    },

    showErrorMessage(message) {
      console.error('💬 Error:', message);
      alert(message); // Replace with a proper toast/notification system
    },
    
    // User Actions
    handleTopicAccess(topicId, type) {
      if (!topicId) return;
      if ((type === 'premium' || type === 'pro') && !this.isPremiumUser) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
      } else {
        // this.$router.push({ name: 'TopicOverview', params: { id: topicId } });
        alert(`Navigating to topic ID: ${topicId}`);
      }
    },

    addToStudyPlan(topic) {
      if (!topic || topic.inStudyPlan) return;
      this.selectedTopic = topic;
      this.showAddModal = true;
    },

    async confirmAddToStudyPlan() {
      if (!this.selectedTopic || !this.userId) {
        this.showErrorMessage('You must be logged in to add topics.');
        this.showAddModal = false;
        return;
      }
      try {
        const topicId = this.extractTopicId(this.selectedTopic.topicId);
        const studyListData = { topicId, topicName: this.selectedTopic.name, subject: this.selectedTopic.subject, level: this.selectedTopic.level };
        const result = await addToStudyList(this.userId, studyListData);

        if (result?.success !== false) {
          this.selectedTopic.inStudyPlan = true;
          this.studyPlanTopics.push(topicId);
          const topicIndex = this.topics.findIndex(t => t && t.topicId === topicId);
          if (topicIndex !== -1) this.topics[topicIndex].inStudyPlan = true;
          this.showAddModal = false;
          this.showSuccessModal = true;
        } else {
          throw new Error(result?.error || 'Failed to add to study plan.');
        }
      } catch (error) {
        console.error('❌ Error adding to study plan:', error);
        this.showErrorMessage('❌ Could not add topic to your study plan.');
        this.showAddModal = false;
      }
    },
    
    // Event Handling & Reactivity
    handleUserStatusChange(newStatus) {
      if (this.userStatus === newStatus) return;
      localStorage.setItem('userStatus', newStatus);
      this.triggerReactivityUpdate();
    },

    setupEventListeners() {
      if (typeof window === 'undefined') return;
      this.handleStorageChange = (event) => {
        if (event.key === 'userStatus') this.handleUserStatusChange(event.newValue);
      };
      window.addEventListener('storage', this.handleStorageChange);
      this.eventCleanupFunctions.push(() => window.removeEventListener('storage', this.handleStorageChange));
    },

    triggerReactivityUpdate() {
      this.componentKey++;
      this.$forceUpdate();
    },

    cleanup() {
      this.eventCleanupFunctions.forEach(cleanup => {
        try { cleanup(); } catch (error) { console.warn('⚠️ Cleanup failed:', error); }
      });
      this.eventCleanupFunctions = [];
    }
  }
};
</script>

<style scoped>
.catalogue-page {
  min-height: 100vh;
  background: #fafbfc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.page-header {
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  padding: 1.5rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  gap: 1rem;
  flex-wrap: wrap;
}

.back-btn {
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  color: #495057;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.back-btn:hover {
  background: #e9ecef;
  transform: translateX(-2px);
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
  transition: all 0.2s;
}

.breadcrumb-item.active {
  background: #a855f7;
  color: white;
}

.breadcrumb-separator {
  color: #adb5bd;
}

.subscription-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.75rem;
  border: 1px solid;
  text-transform: uppercase;
}

.badge-premium {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  border-color: #9333ea;
}

.badge-free {
  background: #f8f9fa;
  color: #495057;
  border-color: #e1e5e9;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  margin: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Filter Bar */
.filter-bar {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s;
  color: #495057;
  flex: 1 1 200px;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.checkbox-label:hover {
  background: #f8f9fa;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.clear-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #6c757d;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.clear-btn:hover {
  background: #e9ecef;
  color: #495057;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  text-align: center;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f3f4;
  border-top: 3px solid #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.6;
}
.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #495057;
  margin: 0.5rem 0;
}
.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Grids */
.subjects-grid, .levels-grid, .topics-grid {
  display: grid;
  gap: 1.5rem;
}
.subjects-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.levels-grid { grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); }
.topics-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }

/* Subject Cards */
.subject-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}
.subject-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(168, 85, 247, 0.15);
  border-color: #a855f7;
}
.card-icon {
  font-size: 3rem;
  margin: 0 auto;
  height: 80px;
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
}
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}
.card-stats {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}
.stat-badge {
  background: #f8f9fa;
  color: #495057;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #e9ecef;
}

/* Level Cards */
.level-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #a855f7;
}
.level-header { display: flex; align-items: center; gap: 1rem; }
.level-icon {
  width: 50px; height: 50px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; flex-shrink: 0; border: 1px solid #e9ecef;
}
.level-icon.level-beginner { background: #d4edda; color: #155724; }
.level-icon.level-intermediate { background: #fff3cd; color: #856404; }
.level-icon.level-advanced { background: #f8d7da; color: #721c24; }
.level-info { flex: 1; }
.level-title { font-size: 1.125rem; font-weight: 600; color: #212529; margin: 0 0 0.25rem 0; }
.level-description { font-size: 0.875rem; color: #6c757d; margin: 0; }
.level-stats { display: flex; gap: 1rem; flex-wrap: wrap; }
.stat-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: #6c757d; }
.stat-icon { font-size: 1rem; }

/* Topic Cards */
.topic-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.topic-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
.topic-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.topic-title { font-size: 1.125rem; font-weight: 600; color: #212529; margin: 0; flex: 1; line-height: 1.4; }
.add-btn {
  width: 32px; height: 32px;
  border-radius: 8px; border: 2px solid #a855f7;
  background: white; color: #a855f7; font-size: 1.25rem;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.add-btn:hover:not(:disabled) { background: #a855f7; color: white; transform: scale(1.05); }
.add-btn:disabled { background: #d4edda; border-color: #c3e6cb; color: #155724; cursor: not-allowed; }
.topic-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.access-badge {
  padding: 0.25rem 0.625rem; border-radius: 6px; font-size: 0.75rem;
  font-weight: 500; border: 1px solid; text-transform: capitalize;
}
.access-badge.free { background: #d4edda; color: #155724; border-color: #c3e6cb; }
.access-badge.premium, .access-badge.pro { background: #fcf8e3; color: #8a6d3b; border-color: #faebcc; }
.topic-stats { display: flex; gap: 1rem; font-size: 0.875rem; }

/* Progress */
.progress-container { margin-top: auto; padding-top: 1rem; }
.progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.progress-label { font-size: 0.875rem; font-weight: 500; color: #495057; }
.progress-value { font-size: 0.875rem; font-weight: 600; color: #212529; }
.progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.progress-fill.progress-completed { background: linear-gradient(90deg, #28a745, #20c997); }
.progress-fill.progress-high { background: linear-gradient(90deg, #a855f7, #9333ea); }
.progress-fill.progress-medium { background: linear-gradient(90deg, #fd7e14, #f59e0b); }
.progress-fill.progress-low { background: linear-gradient(90deg, #dc3545, #e74c3c); }
.progress-fill.progress-none { background: #e9ecef; }

/* Action Button */
.action-btn {
  width: 100%; padding: 0.75rem; border: none; border-radius: 8px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem;
}
.btn-start { background: linear-gradient(135deg, #a855f7, #9333ea); color: white; }
.btn-start:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3); }
.btn-continue { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
.btn-continue:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
.btn-completed { background: #f8f9fa; color: #6c757d; cursor: default; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; backdrop-filter: blur(4px); padding: 1rem;
}
.modal-content {
  background: white; border-radius: 16px; max-width: 500px; width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: modalSlide 0.3s ease-out; position: relative;
}
@keyframes modalSlide { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.modal-close {
  position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px;
  border-radius: 8px; background: #f8f9fa; border: 1px solid #e9ecef;
  color: #6c757d; font-size: 1.5rem; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.modal-close:hover { background: #e9ecef; }
.modal-header { padding: 1.5rem 1.5rem 1rem; border-bottom: 1px solid #e9ecef; }
.modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #212529; padding-right: 2rem; }
.modal-body { padding: 1.5rem; }
.topic-preview { text-align: center; padding: 1.5rem; background: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; }
.topic-preview h4 { margin: 0 0 0.5rem; font-size: 1.125rem; font-weight: 600; color: #212529; }
.topic-preview p { margin: 0 0 1rem; color: #6c757d; font-size: 0.875rem; }
.topic-preview .topic-stats { justify-content: center; }
.modal-footer { padding: 1rem 1.5rem 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end; }
.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem; border: none; border-radius: 8px;
  font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
}
.btn-primary { background: linear-gradient(135deg, #a855f7, #9333ea); color: white; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3); }
.btn-secondary { background: #f8f9fa; color: #6c757d; border: 1px solid #e9ecef; }
.btn-secondary:hover { background: #e9ecef; }

/* Success Modal */
.success-modal .success-content { padding: 2rem; text-align: center; }
.success-icon { font-size: 4rem; margin-bottom: 1rem; }
.success-content h3 { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.75rem; color: #28a745; }
.success-content p { color: #6c757d; margin: 0 0 1.5rem; font-size: 0.875rem; }

/* Responsive */
@media (max-width: 900px) {
  .subjects-grid, .levels-grid, .topics-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
@media (max-width: 768px) {
  .main-content, .page-header { padding: 1.5rem; }
  .header-content { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .page-title { font-size: 1.75rem; padding: 0; }
  .filter-row { flex-direction: column; align-items: stretch; }
  .clear-btn { margin-left: 0; }
  .subjects-grid, .levels-grid, .topics-grid { grid-template-columns: 1fr; }
  .modal-footer { flex-direction: column; }
  .btn-primary, .btn-secondary { width: 100%; }
}
</style>