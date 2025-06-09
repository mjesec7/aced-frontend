<template>
    <div class="vocabulary-page">
      <!-- Header Section -->
      <header class="page-header">
        <h1 class="page-title">
          <span class="title-text">Изучение Словаря</span>
          <div class="title-decoration"></div>
        </h1>
        <p class="page-subtitle">Изучайте языки через умное построение словарного запаса</p>
        
        <!-- Quick Stats -->
        <div class="quick-stats" v-if="stats">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalWords || 0 }}</div>
            <div class="stat-label">Всего слов</div>
            <div class="stat-trend">{{ stats.byLanguage?.length || 0 }} языков</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ userProgress?.wordsLearned || 0 }}</div>
            <div class="stat-label">Изучено слов</div>
            <div class="stat-trend">{{ getProgressTrend() }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ userProgress?.accuracy || 0 }}%</div>
            <div class="stat-label">Точность</div>
            <div class="stat-trend">{{ getAccuracyTrend() }}</div>
          </div>
        </div>
      </header>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Загрузка данных словаря...</p>
      </div>
  
      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">😔</div>
        <h3>Что-то пошло не так</h3>
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Попробовать снова</button>
      </div>
  
      <!-- Main Content -->
      <div v-else class="main-content">
        <!-- Language Cards Grid -->
        <section class="languages-section" v-if="currentView === 'languages'">
          <h2 class="section-title">Доступные языки</h2>
          <div class="languages-grid">
            <div 
              v-for="language in languages" 
              :key="language.code"
              class="language-card"
              :class="{ popular: language.isPopular }"
              @click="selectLanguage(language)"
            >
              <div v-if="language.isPopular" class="language-badge">Популярный</div>
              
              <!-- Progress Ring -->
              <div class="progress-ring">
                <svg width="60" height="60" class="progress-circle">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="4"/>
                  <circle 
                    cx="30" cy="30" r="25" fill="none" 
                    :stroke="getLanguageColor(language.code)" 
                    stroke-width="4" 
                    stroke-dasharray="157" 
                    :stroke-dashoffset="157 - (157 * getLanguageProgress(language.code) / 100)" 
                    class="progress-bar"
                  />
                </svg>
                <div class="progress-text">{{ Math.round(getLanguageProgress(language.code)) }}%</div>
              </div>
              
              <div class="language-flag">{{ getLanguageFlag(language.code) }}</div>
              <div class="language-info">
                <h3 class="language-name">{{ language.nameRu || language.name }}</h3>
                <p class="language-name-en">{{ language.name }}</p>
                <div class="language-stats">
                  <span class="word-count">{{ getLanguageWordCount(language.code) }}</span>
                  <span class="topic-count">{{ getLanguageTopicCount(language.code) }}</span>
                </div>
              </div>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>
  
        <!-- Topics Section -->
        <section v-if="currentView === 'topics'" class="topics-section">
          <div class="section-header">
            <button @click="goBackToLanguages" class="back-btn">
              ← Назад к языкам
            </button>
            
            <div class="language-header">
              <div class="language-flag-large">{{ getLanguageFlag(selectedLanguage) }}</div>
              <div class="language-info-detailed">
                <h2 class="selected-language-title">{{ getSelectedLanguageName() }}</h2>
                <p class="selected-language-subtitle">Выберите тему для изучения</p>
              </div>
            </div>
          </div>
  
          <!-- Search and Filter for Topics -->
          <div class="controls">
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="🔍 Поиск тем..."
                class="search-input"
              />
            </div>
            
            <div class="filter-buttons">
              <button
                v-for="difficulty in difficultyLevels"
                :key="difficulty.value"
                @click="toggleDifficulty(difficulty.value)"
                class="filter-btn"
                :class="{ active: selectedDifficulty === difficulty.value }"
              >
                {{ difficulty.icon }} {{ difficulty.label }}
              </button>
            </div>
          </div>
  
          <!-- Topics Loading -->
          <div v-if="topicsLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Загрузка тем...</p>
          </div>
  
          <!-- Topics Grid -->
          <div v-else-if="filteredTopics.length > 0" class="topics-grid">
            <div
              v-for="topic in filteredTopics"
              :key="topic.name"
              class="topic-card"
              :class="{ 
                completed: isTopicCompleted(topic),
                'in-progress': isTopicInProgress(topic)
              }"
              @click="selectTopic(topic)"
            >
              <div class="topic-icon">{{ getTopicIcon(topic.name) }}</div>
              
              <div class="topic-content">
                <h3 class="topic-name">{{ getTopicNameRu(topic.name) }}</h3>
                <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
                
                <div class="topic-stats">
                  <div class="stat-badge">
                    <span class="stat-icon">📝</span>
                    <span>{{ topic.wordCount || 8 }} {{ getWordPlural(topic.wordCount || 8) }}</span>
                  </div>
                  <div class="stat-badge">
                    <span class="stat-icon">📚</span>
                    <span>{{ topic.subtopicCount || 1 }} {{ getSubtopicPlural(topic.subtopicCount || 1) }}</span>
                  </div>
                  <div class="stat-badge difficulty" :class="topic.difficulty || 'beginner'">
                    <span class="stat-icon">{{ getDifficultyIcon(topic.difficulty || 'beginner') }}</span>
                    <span>{{ getDifficultyLabel(topic.difficulty || 'beginner') }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div class="progress-container" v-if="getTopicProgress(topic) > 0">
                <div class="progress-bar-topic">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getTopicProgress(topic) + '%' }"
                  ></div>
                </div>
                <span class="progress-text-topic">{{ Math.round(getTopicProgress(topic)) }}%</span>
              </div>
              
              <!-- Status Badge -->
              <div class="status-badge" v-if="isTopicCompleted(topic)">
                ✅ Завершено
              </div>
              <div class="status-badge in-progress" v-else-if="isTopicInProgress(topic)">
                📖 В процессе
              </div>
              <div class="status-badge new" v-else>
                🆕 Новое
              </div>
              
              <div class="card-arrow">→</div>
            </div>
          </div>
  
          <!-- No Topics Found -->
          <div v-else class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>Темы не найдены</h3>
            <p v-if="searchQuery">
              Попробуйте изменить поисковый запрос или сбросить фильтры
            </p>
            <p v-else>
              Пока нет доступных тем для {{ getSelectedLanguageName() }}
            </p>
            <button v-if="searchQuery || selectedDifficulty" @click="clearFilters" class="clear-filters-btn">
              Очистить фильтры
            </button>
          </div>
        </section>
  
        <!-- Learning Section -->
        <section v-if="currentView === 'learning'" class="learning-section">
          <div class="learning-header">
            <button @click="goBackToTopics" class="back-btn">
              ← Назад к темам
            </button>
            
            <div class="learning-title">
              <h2>{{ getTopicNameRu(selectedTopic) }}</h2>
              <p>{{ getSelectedLanguageName() }} • {{ currentWords.length }} {{ getWordPlural(currentWords.length) }}</p>
            </div>
  
            <div class="learning-progress">
              <span>{{ currentWordIndex + 1 }} из {{ currentWords.length }}</span>
              <div class="progress-bar-learning">
                <div 
                  class="progress-fill-learning" 
                  :style="{ width: ((currentWordIndex + 1) / currentWords.length) * 100 + '%' }"
                ></div>
              </div>
            </div>
          </div>
  
          <!-- Learning Content -->
          <div v-if="wordsLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Загрузка слов...</p>
          </div>
  
          <div v-else-if="currentWords.length === 0" class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>Слова не найдены</h3>
            <p>Для этой темы пока нет доступных слов</p>
          </div>
  
          <div v-else-if="learningComplete" class="learning-complete">
            <div class="complete-icon">🎉</div>
            <h3>Поздравляем!</h3>
            <p>Вы изучили все слова в теме "{{ getTopicNameRu(selectedTopic) }}"</p>
            <div class="complete-stats">
              <div class="stat-item">
                <span class="stat-number">{{ currentWords.length }}</span>
                <span class="stat-label">{{ getWordPlural(currentWords.length) }} изучено</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ learningProgress.length }}</span>
                <span class="stat-label">отмечено как изученные</span>
              </div>
            </div>
            <div class="complete-actions">
              <button @click="startTest" class="btn-primary test-btn">
                🎯 Пройти тест
              </button>
              <button @click="goBackToTopics" class="btn-secondary">
                Выбрать другую тему
              </button>
            </div>
          </div>
  
          <div v-else class="word-card-container">
            <div class="word-card" :key="currentWordIndex">
              <div class="word-main-display">{{ currentWords[currentWordIndex]?.word }}</div>
              
              <div class="word-details">
                <div v-if="currentWords[currentWordIndex]?.partOfSpeech" class="word-type">
                  {{ currentWords[currentWordIndex].partOfSpeech }}
                </div>
                
                <div class="translation-section">
                  <button @click="toggleTranslation" class="show-translation-btn">
                    {{ showTranslation ? 'Скрыть перевод' : 'Показать перевод' }}
                  </button>
                  
                  <div v-if="showTranslation" class="word-translation-display">
                    {{ currentWords[currentWordIndex]?.translation }}
                  </div>
                </div>
  
                <div v-if="showTranslation && currentWords[currentWordIndex]?.example" class="word-example">
                  <strong>Пример:</strong> {{ currentWords[currentWordIndex].example }}
                </div>
              </div>
  
              <div class="word-actions">
                <button 
                  @click="previousWord" 
                  :disabled="currentWordIndex === 0"
                  class="btn-secondary nav-btn"
                >
                  ← Предыдущее
                </button>
                
                <button @click="markWordAsLearned" class="btn-success learn-btn">
                  ✓ Изучено
                </button>
                
                <button 
                  @click="nextWord" 
                  class="btn-primary nav-btn"
                >
                  {{ currentWordIndex === currentWords.length - 1 ? 'Завершить' : 'Следующее →' }}
                </button>
              </div>
            </div>
  
            <!-- Learning Controls -->
            <div class="learning-controls">
              <button @click="startTest" class="test-btn-floating" :disabled="learningProgress.length < 3">
                🎯 Тест ({{ learningProgress.length }}/{{ currentWords.length }})
              </button>
            </div>
          </div>
        </section>
  
        <!-- Test Section -->
        <section v-if="currentView === 'test'" class="test-section">
          <div class="test-header">
            <button @click="exitTest" class="back-btn">
              ← Назад к изучению
            </button>
            
            <div class="test-title">
              <h2>Тест: {{ getTopicNameRu(selectedTopic) }}</h2>
              <p v-if="!testComplete">Вопрос {{ currentQuestionIndex + 1 }} из {{ testQuestions.length }}</p>
            </div>
          </div>
  
          <div v-if="testComplete" class="test-results">
            <div class="results-icon" :class="{ passed: testResults.passed, failed: !testResults.passed }">
              {{ testResults.passed ? '🎉' : '📚' }}
            </div>
            
            <h3>{{ testResults.passed ? 'Тест пройден!' : 'Попробуйте еще раз' }}</h3>
            
            <div class="results-stats">
              <div class="result-item">
                <span class="result-number">{{ testResults.percentage }}%</span>
                <span class="result-label">Результат</span>
              </div>
              <div class="result-item">
                <span class="result-number">{{ testResults.correct }}/{{ testResults.total }}</span>
                <span class="result-label">Правильных ответов</span>
              </div>
            </div>
  
            <div class="results-actions">
              <button @click="retakeTest" class="btn-primary">
                🔄 Пройти заново
              </button>
              <button @click="exitTest" class="btn-secondary">
                Вернуться к изучению
              </button>
            </div>
          </div>
  
          <div v-else class="test-question">
            <div class="question-progress">
              <div class="progress-bar-test">
                <div 
                  class="progress-fill-test" 
                  :style="{ width: ((currentQuestionIndex + 1) / testQuestions.length) * 100 + '%' }"
                ></div>
              </div>
            </div>
  
            <div class="question-word">
              <h3>Как переводится слово:</h3>
              <div class="test-word">{{ testQuestions[currentQuestionIndex]?.word }}</div>
            </div>
  
            <div class="question-options">
              <button 
                v-for="(option, index) in testQuestions[currentQuestionIndex]?.options" 
                :key="index"
                @click="submitTestAnswer(option)"
                class="option-btn"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </section>
  
        <!-- Quick Actions (only show when on languages view) -->
        <section class="quick-actions" v-if="currentView === 'languages'">
          <h2 class="section-title">Быстрые действия</h2>
          <div class="action-cards">
            <div class="action-card" @click="reviewWords" v-if="wordsForReview > 0">
              <div class="action-count">{{ wordsForReview }}</div>
              <div class="action-icon">📚</div>
              <h4>Повторить</h4>
              <p>Практика недавно изученных слов</p>
            </div>
            
            <div class="action-card" @click="startRandomQuiz">
              <div class="action-icon">🎯</div>
              <h4>Дневной вызов</h4>
              <p>Выполните сегодняшний словарный тест</p>
            </div>
            
            <div class="action-card" @click="viewProgress">
              <div class="action-icon">📊</div>
              <h4>Отчет о прогрессе</h4>
              <p>Посмотрите свою аналитику обучения</p>
            </div>
            
            <div class="action-card" @click="viewAchievements">
              <div class="action-icon">🏆</div>
              <h4>Достижения</h4>
              <p>Проверьте свои учебные достижения</p>
            </div>
          </div>
        </section>
  
        <!-- Recent Activity (only show when on languages view) -->
        <section class="recent-activity" v-if="currentView === 'languages' && recentWords.length > 0">
          <h2 class="section-title">Недавно добавленные слова</h2>
          <div class="recent-words">
            <div 
              v-for="word in recentWords" 
              :key="word._id"
              class="recent-word-card"
              @click="viewWord(word)"
            >
              <div class="word-main">{{ word.word }}</div>
              <div class="word-translation">{{ word.translation }}</div>
              <div class="word-meta">
                <span class="word-language">{{ getLanguageNameRu(word.language) }}</span>
                <span class="word-topic">{{ word.topic }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
  
      <!-- Floating Action Button -->
      <button class="fab" @click="openAddWordModal" v-if="$store.getters.user">
        <span class="fab-icon">+</span>
      </button>
  
      <!-- Add Word Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModalOnOverlay">
        <div class="add-word-modal">
          <div class="modal-header">
            <h3>Добавить новое слово</h3>
            <button class="close-btn" @click="closeAddWordModal">×</button>
          </div>
          <form class="add-word-form" @submit.prevent="submitWord">
            <div class="form-row">
              <div class="form-group">
                <label for="word">Слово</label>
                <input 
                  type="text" 
                  id="word" 
                  v-model="newWord.word" 
                  placeholder="Введите слово" 
                  required
                >
              </div>
              <div class="form-group">
                <label for="translation">Перевод</label>
                <input 
                  type="text" 
                  id="translation" 
                  v-model="newWord.translation" 
                  placeholder="Введите перевод" 
                  required
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="language">Язык</label>
                <select id="language" v-model="newWord.language" required>
                  <option value="">Выберите язык</option>
                  <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                    {{ lang.nameRu || lang.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="topic">Тема</label>
                <input 
                  type="text" 
                  id="topic" 
                  v-model="newWord.topic" 
                  placeholder="например, Путешествия, Бизнес"
                  required
                >
              </div>
            </div>
            <div class="form-group">
              <label for="subtopic">Подтема</label>
              <input 
                type="text" 
                id="subtopic" 
                v-model="newWord.subtopic" 
                placeholder="например, В аэропорту"
                required
              >
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeAddWordModal">Отмена</button>
              <button type="submit" class="btn-primary" :disabled="!isFormValid || submitting">
                {{ submitting ? 'Добавление...' : 'Добавить слово' }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Toast Messages -->
      <div v-if="toastMessage" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </div>
  </template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import {
  getVocabularyLanguages,
  getVocabularyTopics,
  getVocabularyStats,
  getUserVocabularyProgress,
  getWordsForReview,
  searchVocabulary,
  addVocabularyWord,
  getLanguageStats,
  getUserLanguageProgress
} from '@/api/vocabulary';

export default {
  name: 'VocabularyPage',
  setup() {
    const store = useStore();
    
    // Data
    const loading = ref(true);
    const error = ref('');
    const languages = ref([]);
    const stats = ref(null);
    const userProgress = ref(null);
    const recentWords = ref([]);
    const wordsForReview = ref(0);
    const showModal = ref(false);
    const submitting = ref(false);
    const toastMessage = ref('');
    const toastType = ref('success');

    // Language selection and topics
    const selectedLanguage = ref('');
    const selectedTopic = ref('');
    const selectedSubtopic = ref('');
    const currentView = ref('languages'); // 'languages', 'topics', 'learning', 'test'
    const topics = ref([]);
    const currentWords = ref([]);
    const topicsLoading = ref(false);
    const wordsLoading = ref(false);
    const searchQuery = ref('');
    const selectedDifficulty = ref('');

    // Learning state
    const currentWordIndex = ref(0);
    const learningProgress = ref([]);
    const showTranslation = ref(false);
    const learningComplete = ref(false);

    // Test state
    const testMode = ref(false);
    const testQuestions = ref([]);
    const currentQuestionIndex = ref(0);
    const userAnswers = ref([]);
    const testComplete = ref(false);
    const testResults = ref({});

    // Constants
    const difficultyLevels = [
      { value: 'beginner', label: 'Начальный', icon: '🟢' },
      { value: 'intermediate', label: 'Средний', icon: '🟡' },
      { value: 'advanced', label: 'Продвинутый', icon: '🔴' }
    ];

    // Form data
    const newWord = ref({
      word: '',
      translation: '',
      language: '',
      topic: '',
      subtopic: '',
      partOfSpeech: 'noun',
      difficulty: 'beginner'
    });

    // Computed
    const currentUser = computed(() => store.getters.user);
    
    const isFormValid = computed(() => {
      return newWord.value.word.trim() && 
             newWord.value.translation.trim() && 
             newWord.value.language &&
             newWord.value.topic.trim() &&
             newWord.value.subtopic.trim();
    });

    const filteredTopics = computed(() => {
      let filtered = [...topics.value];
      
      if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        filtered = filtered.filter(topic =>
          topic.name.toLowerCase().includes(query) ||
          getTopicNameRu(topic.name).toLowerCase().includes(query) ||
          getTopicDescription(topic.name).toLowerCase().includes(query)
        );
      }
      
      if (selectedDifficulty.value) {
        filtered = filtered.filter(topic => 
          (topic.difficulty || 'beginner') === selectedDifficulty.value
        );
      }
      
      return filtered;
    });

    // Methods
    const getLanguageFlag = (code) => {
      const flags = {
        english: '🇺🇸',
        spanish: '🇪🇸',
        french: '🇫🇷',
        german: '🇩🇪',
        chinese: '🇨🇳',
        arabic: '🇸🇦',
        japanese: '🇯🇵',
        korean: '🇰🇷',
        uzbek: '🇺🇿',
        russian: '🇷🇺'
      };
      return flags[code] || '🌐';
    };

    const getLanguageName = (code) => {
      const language = languages.value.find(l => l.code === code);
      return language ? language.name : code;
    };

    const getLanguageNameRu = (code) => {
      const language = languages.value.find(l => l.code === code);
      return language ? (language.nameRu || language.name) : code;
    };

    const getSelectedLanguageName = () => {
      if (!selectedLanguage.value) return '';
      const language = languages.value.find(l => l.code === selectedLanguage.value);
      return language ? (language.nameRu || language.name) : selectedLanguage.value;
    };

    const getLanguageColor = (code) => {
      const colors = {
        english: '#3b82f6',
        spanish: '#ef4444',
        french: '#8b5cf6',
        german: '#f59e0b',
        chinese: '#dc2626',
        arabic: '#059669',
        japanese: '#db2777',
        korean: '#7c3aed',
        uzbek: '#0891b2',
        russian: '#be123c'
      };
      return colors[code] || '#6b7280';
    };

    const getLanguageProgress = (languageCode) => {
      if (!userProgress.value || !userProgress.value.byLanguage) return 0;
      const langProgress = userProgress.value.byLanguage[languageCode];
      return langProgress ? langProgress.percentage : 0;
    };

    const getLanguageWordCount = (languageCode) => {
      if (!stats.value || !stats.value.byLanguage) return '0 слов';
      const langStat = stats.value.byLanguage.find(l => l._id === languageCode);
      const count = langStat ? langStat.count : 8; // Default to 8 for demo
      return `${count} ${getWordPlural(count)}`;
    };

    const getLanguageTopicCount = (languageCode) => {
      // For demo, show 3 topics per language
      const count = 3;
      return `${count} ${getTopicPlural(count)}`;
    };

    // Russian pluralization functions
    const getTopicPlural = (count) => {
      if (count % 10 === 1 && count % 100 !== 11) return 'тема';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'темы';
      return 'тем';
    };

    const getWordPlural = (count) => {
      if (count % 10 === 1 && count % 100 !== 11) return 'слово';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'слова';
      return 'слов';
    };

    const getSubtopicPlural = (count) => {
      if (count % 10 === 1 && count % 100 !== 11) return 'раздел';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'раздела';
      return 'разделов';
    };

    const getProgressTrend = () => {
      if (!userProgress.value) return 'Начинаем изучение';
      return userProgress.value.weeklyGrowth > 0 ? 
        `+${userProgress.value.weeklyGrowth} на этой неделе` : 
        'Продолжайте практиковаться';
    };

    const getAccuracyTrend = () => {
      if (!userProgress.value) return 'Пока нет данных';
      return userProgress.value.accuracyTrend > 0 ? 
        `+${userProgress.value.accuracyTrend}% улучшение` : 
        'Будьте последовательны';
    };

    // Topic-related methods
    const getTopicIcon = (topicName) => {
      const icons = {
        'Travel': '✈️', 'Путешествия': '✈️',
        'Business': '💼', 'Бизнес': '💼', 
        'Food': '🍽️', 'Еда': '🍽️',
        'Family': '👨‍👩‍👧‍👦', 'Семья': '👨‍👩‍👧‍👦',
        'Education': '🎓', 'Образование': '🎓',
        'Health': '🏥', 'Здоровье': '🏥',
        'Technology': '💻', 'Технологии': '💻',
        'Sports': '⚽', 'Спорт': '⚽',
        'Music': '🎵', 'Музыка': '🎵',
        'Art': '🎨', 'Искусство': '🎨',
        'Nature': '🌿', 'Природа': '🌿',
        'Animals': '🐾', 'Животные': '🐾',
        'Transportation': '🚗', 'Транспорт': '🚗',
        'Shopping': '🛍️', 'Покупки': '🛍️',
        'Weather': '🌤️', 'Погода': '🌤️',
        'Time': '⏰', 'Время': '⏰',
        'Colors': '🌈', 'Цвета': '🌈',
        'Numbers': '🔢', 'Числа': '🔢',
        'Daily Life': '🏠', 'Повседневная жизнь': '🏠'
      };
      return icons[topicName] || '📖';
    };

    const getTopicNameRu = (topicName) => {
      const translations = {
        'Travel': 'Путешествия',
        'Business': 'Бизнес',
        'Food': 'Еда',
        'Family': 'Семья',
        'Education': 'Образование',
        'Health': 'Здоровье',
        'Technology': 'Технологии',
        'Sports': 'Спорт',
        'Music': 'Музыка',
        'Art': 'Искусство',
        'Nature': 'Природа',
        'Animals': 'Животные',
        'Transportation': 'Транспорт',
        'Shopping': 'Покупки',
        'Weather': 'Погода',
        'Time': 'Время',
        'Colors': 'Цвета',
        'Numbers': 'Числа',
        'Daily Life': 'Повседневная жизнь'
      };
      return translations[topicName] || topicName;
    };

    const getTopicDescription = (topicName) => {
      const descriptions = {
        'Travel': 'Слова для путешествий и туризма',
        'Путешествия': 'Слова для путешествий и туризма',
        'Business': 'Деловая лексика и термины',
        'Бизнес': 'Деловая лексика и термины',
        'Food': 'Еда, напитки и приготовление пищи',
        'Еда': 'Еда, напитки и приготовление пищи',
        'Family': 'Семья, родственники и отношения',
        'Семья': 'Семья, родственники и отношения',
        'Education': 'Образование, школа, университет',
        'Образование': 'Образование, школа, университет',
        'Health': 'Здоровье, медицина, части тела',
        'Здоровье': 'Здоровье, медицина, части тела',
        'Technology': 'Технологии, компьютеры, интернет',
        'Технологии': 'Технологии, компьютеры, интернет',
        'Sports': 'Спорт, игры, физическая активность',
        'Спорт': 'Спорт, игры, физическая активность',
        'Music': 'Музыка, инструменты, жанры',
        'Музыка': 'Музыка, инструменты, жанры',
        'Art': 'Искусство, творчество, культура',
        'Искусство': 'Искусство, творчество, культура'
      };
      return descriptions[topicName] || 'Изучайте новые слова и выражения';
    };

    const getDifficultyIcon = (difficulty) => {
      const icons = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' };
      return icons[difficulty] || '⚪';
    };

    const getDifficultyLabel = (difficulty) => {
      const labels = { 
        beginner: 'Легкий', 
        intermediate: 'Средний', 
        advanced: 'Сложный' 
      };
      return labels[difficulty] || difficulty;
    };

    const getTopicProgress = (topic) => {
      if (!userProgress.value || !userProgress.value.topics) return 0;
      const topicProgress = userProgress.value.topics[topic.name];
      return topicProgress ? topicProgress.percentage : 0;
    };

    const isTopicCompleted = (topic) => getTopicProgress(topic) >= 90;
    const isTopicInProgress = (topic) => {
      const progress = getTopicProgress(topic);
      return progress > 0 && progress < 90;
    };

    const showToast = (message, type = 'success') => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => { toastMessage.value = ''; }, 3000);
    };

    const selectLanguage = async (language) => {
      console.log('🌍 Выбран язык:', language.code);
      selectedLanguage.value = language.code;
      currentView.value = 'topics';
      await fetchTopics(language.code);
    };

    const goBackToLanguages = () => {
      selectedLanguage.value = '';
      selectedTopic.value = '';
      selectedSubtopic.value = '';
      currentView.value = 'languages';
      topics.value = [];
      currentWords.value = [];
      searchQuery.value = '';
      selectedDifficulty.value = '';
      resetLearningState();
    };

    const selectTopic = async (topic) => {
      console.log('📖 Выбрана тема:', topic.name);
      selectedTopic.value = topic.name;
      currentView.value = 'learning';
      await fetchTopicWords(selectedLanguage.value, topic.name);
    };

    const goBackToTopics = () => {
      selectedTopic.value = '';
      selectedSubtopic.value = '';
      currentView.value = 'topics';
      currentWords.value = [];
      resetLearningState();
    };

    const toggleDifficulty = (difficulty) => {
      if (selectedDifficulty.value === difficulty) {
        selectedDifficulty.value = '';
      } else {
        selectedDifficulty.value = difficulty;
      }
      console.log('🎯 Фильтр сложности:', selectedDifficulty.value || 'сброшен');
    };

    const clearFilters = () => {
      searchQuery.value = '';
      selectedDifficulty.value = '';
      showToast('Фильтры очищены');
    };

    // Learning methods
    const resetLearningState = () => {
      currentWordIndex.value = 0;
      learningProgress.value = [];
      showTranslation.value = false;
      learningComplete.value = false;
      testMode.value = false;
      testQuestions.value = [];
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
      testResults.value = {};
    };

    const nextWord = () => {
      if (currentWordIndex.value < currentWords.value.length - 1) {
        currentWordIndex.value++;
        showTranslation.value = false;
      } else {
        learningComplete.value = true;
        showToast('🎉 Вы изучили все слова в этой теме!');
      }
    };

    const previousWord = () => {
      if (currentWordIndex.value > 0) {
        currentWordIndex.value--;
        showTranslation.value = false;
      }
    };

    const toggleTranslation = () => {
      showTranslation.value = !showTranslation.value;
    };

    const markWordAsLearned = () => {
      const currentWord = currentWords.value[currentWordIndex.value];
      if (currentWord && !learningProgress.value.includes(currentWord._id)) {
        learningProgress.value.push(currentWord._id);
        showToast('✅ Слово отмечено как изученное');
      }
    };

    // Test methods
    const startTest = () => {
      if (currentWords.value.length === 0) {
        showToast('Сначала изучите слова, чтобы пройти тест', 'error');
        return;
      }

      const learnedWords = currentWords.value.filter(word => 
        learningProgress.value.includes(word._id)
      );

      if (learnedWords.length < 3) {
        showToast('Изучите минимум 3 слова для прохождения теста', 'error');
        return;
      }

      testQuestions.value = generateTestQuestions(learnedWords);
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
      testMode.value = true;
      currentView.value = 'test';
    };

    const generateTestQuestions = (words) => {
      const questions = [];
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);

      shuffledWords.slice(0, Math.min(10, shuffledWords.length)).forEach(word => {
        const options = [word.translation];
        
        const otherWords = words.filter(w => w._id !== word._id);
        const wrongAnswers = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.translation);
        
        options.push(...wrongAnswers);
        const shuffledOptions = options.sort(() => Math.random() - 0.5);
        
        questions.push({
          word: word.word,
          correctAnswer: word.translation,
          options: shuffledOptions,
          type: 'multiple_choice'
        });
      });

      return questions;
    };

    const submitTestAnswer = (selectedAnswer) => {
      const currentQuestion = testQuestions.value[currentQuestionIndex.value];
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      userAnswers.value.push({
        question: currentQuestion,
        userAnswer: selectedAnswer,
        correct: isCorrect
      });

      if (currentQuestionIndex.value < testQuestions.value.length - 1) {
        currentQuestionIndex.value++;
      } else {
        completeTest();
      }
    };

    const completeTest = () => {
      const correctAnswers = userAnswers.value.filter(a => a.correct).length;
      const totalQuestions = testQuestions.value.length;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      testResults.value = {
        correct: correctAnswers,
        total: totalQuestions,
        percentage: percentage,
        passed: percentage >= 70
      };

      testComplete.value = true;
      
      if (testResults.value.passed) {
        showToast(`🎉 Тест пройден! Результат: ${percentage}%`);
      } else {
        showToast(`📚 Продолжайте изучение. Результат: ${percentage}%`, 'info');
      }
    };

    const retakeTest = () => {
      testQuestions.value = generateTestQuestions(
        currentWords.value.filter(word => learningProgress.value.includes(word._id))
      );
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
    };

    const exitTest = () => {
      testMode.value = false;
      currentView.value = 'learning';
      testQuestions.value = [];
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
    };

    const reviewWords = () => showToast('Функция повторения скоро появится!');
    const startRandomQuiz = () => showToast('Функция викторины скоро появится!');
    const viewProgress = () => showToast('Функция прогресса скоро появится!');
    const viewAchievements = () => showToast('Функция достижений скоро появится!');
    const viewWord = (word) => showToast(`Просмотр: ${word.word} - ${word.translation}`);

    // Modal methods
    const openAddWordModal = () => {
      if (!currentUser.value) {
        showToast('Пожалуйста, войдите в систему для добавления слов', 'error');
        return;
      }
      showModal.value = true;
      document.body.style.overflow = 'hidden';
    };

    const closeAddWordModal = () => {
      showModal.value = false;
      document.body.style.overflow = 'auto';
      resetForm();
    };

    const closeModalOnOverlay = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeAddWordModal();
      }
    };

    const resetForm = () => {
      newWord.value = {
        word: '', translation: '', language: '', topic: '', subtopic: '',
        partOfSpeech: 'noun', difficulty: 'beginner'
      };
    };

    const submitWord = async () => {
      if (!isFormValid.value || submitting.value) return;
      
      try {
        submitting.value = true;
        const wordData = {
          ...newWord.value,
          translationLanguage: 'russian',
          isActive: true,
          importance: 3,
          examples: [], synonyms: [], antonyms: []
        };
        
        console.log('📝 Добавление слова:', wordData);
        const response = await addVocabularyWord(wordData);
        
        recentWords.value.unshift({
          _id: response._id || Date.now(),
          word: wordData.word,
          translation: wordData.translation,
          language: wordData.language,
          topic: wordData.topic
        });
        
        if (recentWords.value.length > 10) {
          recentWords.value = recentWords.value.slice(0, 10);
        }
        
        showToast('Слово успешно добавлено!');
        closeAddWordModal();
        await fetchStats();
        
      } catch (error) {
        console.error('❌ Ошибка добавления слова:', error);
        showToast('Не удалось добавить слово. Попробуйте еще раз.', 'error');
      } finally {
        submitting.value = false;
      }
    };

    // API calls
    const fetchLanguages = async () => {
      try {
        console.log('🌍 Fetching available languages...');
        const response = await getVocabularyLanguages();
        const languageData = response.data || [];
        
        languages.value = languageData.map(lang => ({
          ...lang,
          isPopular: ['english', 'spanish', 'french'].includes(lang.code)
        }));
        
      } catch (err) {
        console.error('❌ Error fetching languages:', err);
        languages.value = [
          { code: 'english', name: 'English', nameRu: 'Английский', isPopular: true },
          { code: 'spanish', name: 'Spanish', nameRu: 'Испанский', isPopular: true },
          { code: 'french', name: 'French', nameRu: 'Французский', isPopular: true },
          { code: 'german', name: 'German', nameRu: 'Немецкий', isPopular: false },
          { code: 'chinese', name: 'Chinese', nameRu: 'Китайский', isPopular: false },
          { code: 'arabic', name: 'Arabic', nameRu: 'Арабский', isPopular: false },
          { code: 'japanese', name: 'Japanese', nameRu: 'Японский', isPopular: false },
          { code: 'korean', name: 'Korean', nameRu: 'Корейский', isPopular: false },
          { code: 'uzbek', name: 'Uzbek', nameRu: 'Узбекский', isPopular: false },
          { code: 'russian', name: 'Russian', nameRu: 'Русский', isPopular: false }
        ];
      }
    };

    const fetchStats = async () => {
      try {
        console.log('📊 Fetching vocabulary stats...');
        const response = await getVocabularyStats();
        stats.value = response.data || { totalWords: 0, byLanguage: [], topTopics: [] };
      } catch (err) {
        console.error('❌ Error fetching stats:', err);
        stats.value = { totalWords: 0, byLanguage: [], topTopics: [] };
      }
    };

    const fetchUserProgress = async () => {
      if (!currentUser.value) return;
      
      try {
        console.log('📈 Fetching user progress...');
        const response = await getUserVocabularyProgress(currentUser.value.uid);
        userProgress.value = response.data || {
          wordsLearned: 0, accuracy: 0, weeklyGrowth: 0, accuracyTrend: 0, byLanguage: {}
        };
      } catch (err) {
        console.error('❌ Error fetching user progress:', err);
        userProgress.value = {
          wordsLearned: 0, accuracy: 0, weeklyGrowth: 0, accuracyTrend: 0, byLanguage: {}
        };
      }
    };

    const fetchWordsForReview = async () => {
      if (!currentUser.value) return;
      
      try {
        console.log('🔄 Fetching words for review...');
        const response = await getWordsForReview(currentUser.value.uid, { limit: 50 });
        wordsForReview.value = response.count || 0;
      } catch (err) {
        console.error('❌ Error fetching words for review:', err);
        wordsForReview.value = 0;
      }
    };

    const fetchRecentWords = async () => {
      try {
        console.log('📚 Fetching recent words...');
        const response = await searchVocabulary({ limit: 10, sort: '-createdAt' });
        recentWords.value = response.data || [];
      } catch (err) {
        console.error('❌ Error fetching recent words:', err);
        recentWords.value = [];
      }
    };

    const fetchTopics = async (languageCode) => {
      try {
        topicsLoading.value = true;
        console.log('📚 Fetching topics for language:', languageCode);
        
        // Generate sample topics since API might not have them
        const sampleTopics = [
          { name: 'Travel', difficulty: 'beginner', wordCount: 8, subtopicCount: 1 },
          { name: 'Food', difficulty: 'beginner', wordCount: 8, subtopicCount: 1 },
          { name: 'Family', difficulty: 'intermediate', wordCount: 8, subtopicCount: 1 }
        ];
        
        topics.value = sampleTopics;
        console.log('✅ Topics fetched:', topics.value.length, 'topics');
        
      } catch (err) {
        console.error('❌ Error fetching topics:', err);
        topics.value = [];
      } finally {
        topicsLoading.value = false;
      }
    };

    const fetchTopicWords = async (languageCode, topicName) => {
      try {
        wordsLoading.value = true;
        console.log('📝 Получение слов для темы:', topicName, 'язык:', languageCode);
        
        const sampleWords = generateSampleWords(languageCode, topicName);
        currentWords.value = sampleWords;
        
        resetLearningState();
        
        console.log('✅ Слова получены:', currentWords.value.length, 'слов');
        
      } catch (err) {
        console.error('❌ Ошибка получения слов:', err);
        currentWords.value = [];
        showToast('Не удалось загрузить слова для этой темы', 'error');
      } finally {
        wordsLoading.value = false;
      }
    };

    const generateSampleWords = (languageCode, topicName) => {
      const vocabularyData = {
        english: {
          'Travel': [
            { word: 'airport', translation: 'аэропорт', example: 'I arrived at the airport early.' },
            { word: 'hotel', translation: 'отель', example: 'The hotel was very comfortable.' },
            { word: 'passport', translation: 'паспорт', example: 'Don\'t forget your passport.' },
            { word: 'luggage', translation: 'багаж', example: 'My luggage is heavy.' },
            { word: 'flight', translation: 'рейс', example: 'The flight was delayed.' },
            { word: 'ticket', translation: 'билет', example: 'I bought a ticket online.' },
            { word: 'vacation', translation: 'отпуск', example: 'I love my vacation.' },
            { word: 'tourist', translation: 'турист', example: 'The tourist took many photos.' }
          ],
          'Food': [
            { word: 'apple', translation: 'яблоко', example: 'I eat an apple every day.' },
            { word: 'bread', translation: 'хлеб', example: 'Fresh bread smells wonderful.' },
            { word: 'cheese', translation: 'сыр', example: 'This cheese is delicious.' },
            { word: 'chicken', translation: 'курица', example: 'Grilled chicken is healthy.' },
            { word: 'vegetables', translation: 'овощи', example: 'Eat more vegetables.' },
            { word: 'fruit', translation: 'фрукт', example: 'Fruit is good for you.' },
            { word: 'water', translation: 'вода', example: 'Drink plenty of water.' },
            { word: 'coffee', translation: 'кофе', example: 'I drink coffee in the morning.' }
          ],
          'Family': [
            { word: 'mother', translation: 'мать', example: 'My mother is kind.' },
            { word: 'father', translation: 'отец', example: 'My father works hard.' },
            { word: 'brother', translation: 'брат', example: 'I have one brother.' },
            { word: 'sister', translation: 'сестра', example: 'My sister is younger.' },
            { word: 'child', translation: 'ребенок', example: 'The child is playing.' },
            { word: 'parents', translation: 'родители', example: 'My parents are proud of me.' },
            { word: 'family', translation: 'семья', example: 'Family is important.' },
            { word: 'grandmother', translation: 'бабушка', example: 'My grandmother tells stories.' }
          ]
        },
        spanish: {
          'Travel': [
            { word: 'aeropuerto', translation: 'аэропорт', example: 'El aeropuerto está lejos.' },
            { word: 'hotel', translation: 'отель', example: 'El hotel es cómodo.' },
            { word: 'pasaporte', translation: 'паспорт', example: 'Necesito mi pasaporte.' },
            { word: 'equipaje', translation: 'багаж', example: 'Mi equipaje es pesado.' },
            { word: 'vuelo', translation: 'рейс', example: 'El vuelo sale a las 8.' },
            { word: 'boleto', translation: 'билет', example: 'Compré el boleto online.' },
            { word: 'vacaciones', translation: 'отпуск', example: 'Me encantan las vacaciones.' },
            { word: 'turista', translation: 'турист', example: 'El turista tomó muchas fotos.' }
          ],
          'Food': [
            { word: 'manzana', translation: 'яблоко', example: 'Como una manzana.' },
            { word: 'pan', translation: 'хлеб', example: 'El pan está fresco.' },
            { word: 'queso', translation: 'сыр', example: 'Me gusta el queso.' },
            { word: 'pollo', translation: 'курица', example: 'El pollo está delicioso.' },
            { word: 'verduras', translation: 'овощи', example: 'Come más verduras.' },
            { word: 'fruta', translation: 'фрукт', example: 'La fruta es buena.' },
            { word: 'agua', translation: 'вода', example: 'Bebo mucha agua.' },
            { word: 'café', translation: 'кофе', example: 'Tomo café por la mañana.' }
          ],
          'Family': [
            { word: 'madre', translation: 'мать', example: 'Mi madre es amable.' },
            { word: 'padre', translation: 'отец', example: 'Mi padre trabaja mucho.' },
            { word: 'hermano', translation: 'брат', example: 'Tengo un hermano.' },
            { word: 'hermana', translation: 'сестра', example: 'Mi hermana es menor.' },
            { word: 'niño', translation: 'ребенок', example: 'El niño está jugando.' },
            { word: 'padres', translation: 'родители', example: 'Mis padres están orgullosos.' },
            { word: 'familia', translation: 'семья', example: 'La familia es importante.' },
            { word: 'abuela', translation: 'бабушка', example: 'Mi abuela cuenta historias.' }
          ]
        },
        french: {
          'Travel': [
            { word: 'aéroport', translation: 'аэропорт', example: 'Je suis arrivé à l\'aéroport tôt.' },
            { word: 'hôtel', translation: 'отель', example: 'L\'hôtel était confortable.' },
            { word: 'passeport', translation: 'паспорт', example: 'N\'oubliez pas votre passeport.' },
            { word: 'bagages', translation: 'багаж', example: 'Mes bagages sont lourds.' },
            { word: 'vol', translation: 'рейс', example: 'Le vol a été retardé.' },
            { word: 'billet', translation: 'билет', example: 'J\'ai acheté un billet en ligne.' },
            { word: 'vacances', translation: 'отпуск', example: 'J\'adore mes vacances.' },
            { word: 'touriste', translation: 'турист', example: 'Le touriste a pris beaucoup de photos.' }
          ],
          'Food': [
            { word: 'pomme', translation: 'яблоко', example: 'Je mange une pomme chaque jour.' },
            { word: 'pain', translation: 'хлеб', example: 'Le pain frais sent bon.' },
            { word: 'fromage', translation: 'сыр', example: 'Ce fromage est délicieux.' },
            { word: 'poulet', translation: 'курица', example: 'Le poulet grillé est sain.' },
            { word: 'légumes', translation: 'овощи', example: 'Mangez plus de légumes.' },
            { word: 'fruit', translation: 'фрукт', example: 'Les fruits sont bons pour vous.' },
            { word: 'eau', translation: 'вода', example: 'Buvez beaucoup d\'eau.' },
            { word: 'café', translation: 'кофе', example: 'Je bois du café le matin.' }
          ],
          'Family': [
            { word: 'mère', translation: 'мать', example: 'Ma mère est gentille.' },
            { word: 'père', translation: 'отец', example: 'Mon père travaille dur.' },
            { word: 'frère', translation: 'брат', example: 'J\'ai un frère.' },
            { word: 'sœur', translation: 'сестра', example: 'Ma sœur est plus jeune.' },
            { word: 'enfant', translation: 'ребенок', example: 'L\'enfant joue.' },
            { word: 'parents', translation: 'родители', example: 'Mes parents sont fiers de moi.' },
            { word: 'famille', translation: 'семья', example: 'La famille est importante.' },
            { word: 'grand-mère', translation: 'бабушка', example: 'Ma grand-mère raconte des histoires.' }
          ]
        }
      };

      const words = vocabularyData[languageCode]?.[topicName] || vocabularyData[languageCode]?.['Travel'] || [];
      
      return words.map((word, index) => ({
        _id: `${languageCode}_${topicName}_${index}`,
        word: word.word,
        translation: word.translation,
        example: word.example,
        language: languageCode,
        topic: topicName,
        difficulty: 'beginner',
        partOfSpeech: 'noun'
      }));
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        console.log('🚀 Starting vocabulary data fetch...');
        
        await Promise.all([
          fetchLanguages(),
          fetchStats(),
          fetchRecentWords()
        ]);
        
        if (currentUser.value) {
          await Promise.all([
            fetchUserProgress(),
            fetchWordsForReview()
          ]);
        }
        
        console.log('✅ All vocabulary data fetched successfully');
        
      } catch (err) {
        console.error('❌ Error fetching vocabulary data:', err);
        error.value = 'Не удалось загрузить данные словаря. Попробуйте еще раз.';
      } finally {
        loading.value = false;
      }
    };

    // Watchers
    watch(currentUser, async (newUser, oldUser) => {
      if (newUser && !oldUser) {
        console.log('👤 User logged in, fetching user data...');
        await fetchUserProgress();
        await fetchWordsForReview();
      } else if (!newUser && oldUser) {
        console.log('👋 User logged out, clearing user data...');
        userProgress.value = null;
        wordsForReview.value = 0;
      }
    });

    // Lifecycle
    onMounted(async () => {
      console.log('🎯 VocabularyPage mounted');
      await fetchData();
    });

    // Keyboard event handling
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && showModal.value) {
        closeAddWordModal();
      }
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleKeydown);
    });

    return {
      loading,
      error,
      languages,
      stats,
      userProgress,
      recentWords,
      wordsForReview,
      showModal,
      submitting,
      toastMessage,
      toastType,
      newWord,
      
      // Language selection and topics
      selectedLanguage,
      selectedTopic,
      selectedSubtopic,
      currentView,
      topics,
      currentWords,
      topicsLoading,
      wordsLoading,
      searchQuery,
      selectedDifficulty,
      difficultyLevels,
      filteredTopics,
      
      // Learning state
      currentWordIndex,
      learningProgress,
      showTranslation,
      learningComplete,
      
      // Test state
      testMode,
      testQuestions,
      currentQuestionIndex,
      userAnswers,
      testComplete,
      testResults,
      
      // Computed
      currentUser,
      isFormValid,
      
      // Methods
      getLanguageFlag,
      getLanguageName,
      getLanguageColor,
      getLanguageProgress,
      getLanguageWordCount,
      getLanguageTopicCount,
      getProgressTrend,
      getAccuracyTrend,
      getTopicIcon,
      getTopicDescription,
      getDifficultyIcon,
      getDifficultyLabel,
      getTopicProgress,
      isTopicCompleted,
      isTopicInProgress,
      getSelectedLanguageName,
      getLanguageNameRu,
      getTopicNameRu,
      getTopicPlural,
      getWordPlural,
      getSubtopicPlural,
      selectLanguage,
      goBackToLanguages,
      goBackToTopics,
      selectTopic,
      clearFilters,
      toggleDifficulty,
      
      // Learning methods
      nextWord,
      previousWord,
      toggleTranslation,
      markWordAsLearned,
      
      // Test methods
      startTest,
      submitTestAnswer,
      retakeTest,
      exitTest,
      
      reviewWords,
      startRandomQuiz,
      viewProgress,
      viewAchievements,
      viewWord,
      openAddWordModal,
      closeAddWordModal,
      closeModalOnOverlay,
      submitWord,
      fetchData
    };
  }
};
</script>
<style scoped>
/* CSS Variables for consistent theming */
:root {
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #dbeafe;
  --secondary-color: #10b981;
  --accent-color: #f59e0b;
  --danger-color: #ef4444;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --background: #ffffff;
  --background-secondary: #f9fafb;
  --border-color: #e5e7eb;
  --border-light: #f3f4f6;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --border-radius-sm: 6px;
  --border-radius-md: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 24px;
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}

/* Base styles and layout fixes */
.vocabulary-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: var(--text-primary);
}

.main-content {
  position: relative;
  z-index: 1;
}

/* Ensure all text is visible */
.vocabulary-page * {
  color: inherit;
}

.vocabulary-page h1,
.vocabulary-page h2,
.vocabulary-page h3,
.vocabulary-page h4,
.vocabulary-page .language-name,
.vocabulary-page .topic-name,
.vocabulary-page .selected-language-title {
  color: var(--text-primary) !important;
}

.vocabulary-page p,
.vocabulary-page span,
.vocabulary-page .language-name-en,
.vocabulary-page .topic-description,
.vocabulary-page .selected-language-subtitle {
  color: var(--text-secondary) !important;
}

/* Header Styles */
.page-header {
  text-align: center;
  margin-bottom: 64px;
  position: relative;
  z-index: 2;
}

.page-title {
  position: relative;
  margin-bottom: 16px;
}

.title-text {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  display: inline-block;
  position: relative;
  z-index: 2;
}

.title-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 60%;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 50px;
  z-index: 1;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
  33% { transform: translate(-50%, -50%) rotate(1deg) scale(1.05); }
  66% { transform: translate(-50%, -50%) rotate(-1deg) scale(0.95); }
}

.page-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.stat-card {
  background: var(--background);
  padding: 32px 24px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
  backdrop-filter: blur(10px);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--gradient-primary);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-label {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 500;
}

/* Section Titles */
.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 32px;
  text-align: center;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 2px;
}

/* Languages Section */
.languages-section {
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
  position: relative;
  z-index: 1;
}

.language-card {
  background: var(--background);
  border-radius: var(--border-radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.language-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
  z-index: 1;
}

.language-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.language-card.popular {
  border-color: var(--accent-color);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%);
}

.language-card.popular:hover {
  border-color: var(--accent-color);
  box-shadow: 0 20px 40px rgba(245, 158, 11, 0.2);
}

.language-flag {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 2;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.language-info {
  text-align: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 2;
}

.language-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.language-name-en {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-style: italic;
}

.language-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 0.875rem;
}

.word-count,
.topic-count {
  background: var(--border-light);
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  color: var(--text-primary) !important;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.language-card:hover .word-count,
.language-card:hover .topic-count {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.language-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--gradient-warning);
  color: white;
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 3;
  box-shadow: var(--shadow-md);
}

.progress-ring {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 60px;
  height: 60px;
  z-index: 3;
}

.progress-circle {
  transform: rotate(-90deg);
}

.progress-bar {
  transition: stroke-dashoffset 1s ease-in-out;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-color);
}

.card-arrow {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 1.5rem;
  color: var(--text-muted);
  transition: all var(--transition-normal);
  z-index: 2;
}

.language-card:hover .card-arrow {
  transform: translateX(8px);
  color: var(--primary-color);
}

/* Topics Section */
.topics-section {
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
  min-height: 400px;
}

.section-header {
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
}

.back-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 24px;
}

.back-btn:hover {
  background: #e5e7eb;
  transform: translateX(-2px);
}

.language-header {
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: center;
  margin-bottom: 24px;
}

.language-flag-large {
  font-size: 4rem;
}

.selected-language-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.selected-language-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 8px 0 0 0;
}

/* Controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
  position: relative;
  z-index: 2;
}

.search-box {
  max-width: 400px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: var(--background);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.filter-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--background);
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.filter-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
  position: relative;
  z-index: 1;
  min-height: 300px;
}

.topic-card {
  background: var(--background);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.topic-card.completed {
  border-color: var(--secondary-color);
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.topic-card.in-progress {
  border-color: var(--accent-color);
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.topic-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 16px;
}

.topic-content {
  margin-bottom: 20px;
}

.topic-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  text-align: center;
}

.topic-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  text-align: center;
  line-height: 1.5;
}

.topic-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--border-light);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--text-primary) !important;
}

.stat-badge.difficulty {
  font-weight: 600;
}

.stat-badge.difficulty.beginner {
  background: #dcfce7;
  color: #166534;
}

.stat-badge.difficulty.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.stat-badge.difficulty.advanced {
  background: #fee2e2;
  color: #991b1b;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-bar-topic {
  flex: 1;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text-topic {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
  min-width: 35px;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--secondary-color);
  color: white;
}

.status-badge.in-progress {
  background: var(--accent-color);
}

.status-badge.new {
  background: var(--text-muted);
}

/* Learning Section */
.learning-section {
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.learning-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  text-align: center;
}

.learning-title h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary) !important;
  margin-bottom: 8px;
}

.learning-title p {
  color: var(--text-secondary) !important;
  font-size: 1.1rem;
}

.learning-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}

.learning-progress span {
  font-weight: 600;
  color: var(--text-primary) !important;
  min-width: 80px;
}

.progress-bar-learning {
  flex: 1;
  max-width: 300px;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-learning {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.word-card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.word-card {
  background: var(--background);
  border-radius: var(--border-radius-xl);
  padding: 48px;
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--border-color);
  max-width: 600px;
  width: 100%;
  text-align: center;
  animation: slideInUp 0.5s ease;
}

.word-main-display {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-primary) !important;
  margin-bottom: 32px;
  line-height: 1.2;
}

.word-details {
  margin-bottom: 32px;
}

.word-type {
  font-size: 0.875rem;
  color: var(--text-muted) !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.translation-section {
  margin-bottom: 24px;
}

.show-translation-btn {
  background: var(--primary-light);
  color: var(--primary-dark) !important;
  border: 2px solid var(--primary-color);
  padding: 12px 24px;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast);
  margin-bottom: 16px;
}

.show-translation-btn:hover {
  background: var(--primary-color);
  color: white !important;
}

.word-translation-display {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--secondary-color) !important;
  animation: fadeIn 0.3s ease;
}

.word-example {
  background: var(--border-light);
  padding: 16px;
  border-radius: var(--border-radius-md);
  margin-top: 16px;
  font-style: italic;
  color: var(--text-secondary) !important;
}

.word-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-btn, .learn-btn {
  padding: 12px 24px;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  background: var(--gradient-success);
  color: white !important;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.learning-controls {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.test-btn-floating {
  background: var(--gradient-primary);
  color: white !important;
  border: none;
  padding: 16px 24px;
  border-radius: var(--border-radius-lg);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal);
}

.test-btn-floating:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.test-btn-floating:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.learning-complete {
  text-align: center;
  padding: 60px 24px;
  background: var(--background);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  margin: 0 auto;
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.learning-complete h3 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary) !important;
  margin-bottom: 16px;
}

.learning-complete p {
  color: var(--text-secondary) !important;
  margin-bottom: 32px;
  font-size: 1.1rem;
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 32px;
}

.complete-stats .stat-item {
  text-align: center;
}

.complete-stats .stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary-color) !important;
  display: block;
}

.complete-stats .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary) !important;
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Test Section */
.test-section {
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.test-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  text-align: center;
}

.test-title h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary) !important;
  margin-bottom: 8px;
}

.test-title p {
  color: var(--text-secondary) !important;
  font-size: 1.1rem;
}

.test-results {
  text-align: center;
  padding: 60px 24px;
  background: var(--background);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  margin: 0 auto;
}

.results-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.results-icon.passed {
  color: var(--secondary-color);
}

.results-icon.failed {
  color: var(--accent-color);
}

.test-results h3 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary) !important;
  margin-bottom: 32px;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 32px;
}

.result-item {
  text-align: center;
}

.result-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color) !important;
  display: block;
}

.result-label {
  font-size: 0.875rem;
  color: var(--text-secondary) !important;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.test-question {
  max-width: 800px;
  margin: 0 auto;
}

.question-progress {
  margin-bottom: 40px;
}

.progress-bar-test {
  width: 100%;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-test {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.question-word {
  text-align: center;
  margin-bottom: 40px;
  background: var(--background);
  padding: 40px;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
}

.question-word h3 {
  font-size: 1.5rem;
  color: var(--text-secondary) !important;
  margin-bottom: 20px;
  font-weight: 500;
}

.test-word {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-primary) !important;
  line-height: 1.2;
}

.question-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.option-btn {
  background: var(--background);
  border: 2px solid var(--border-color);
  color: var(--text-primary) !important;
  padding: 20px 24px;
  border-radius: var(--border-radius-lg);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.option-btn:active {
  transform: translateY(0);
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.action-card {
  background: var(--background);
  border-radius: var(--border-radius-lg);
  padding: 32px 24px;
  text-align: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
  transform: translateY(100%);
  transition: transform var(--transition-normal);
}

.action-card:hover::before {
  transform: translateY(0);
}

.action-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
  transition: transform var(--transition-normal);
}

.action-card:hover .action-icon {
  transform: scale(1.1) rotate(5deg);
}

.action-card h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.action-card p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  position: relative;
  z-index: 2;
}

.action-count {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--gradient-primary);
  color: white;
  padding: 6px 12px;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 3;
  box-shadow: var(--shadow-md);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Recent Activity */
.recent-activity {
  margin-bottom: 100px;
}

.recent-words {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.recent-word-card {
  background: var(--background);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.recent-word-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--gradient-primary);
  transform: scaleY(0);
  transition: transform var(--transition-normal);
}

.recent-word-card:hover::before {
  transform: scaleY(1);
}

.recent-word-card:hover {
  transform: translateY(-6px) translateX(8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.word-main {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.word-translation {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-style: italic;
}

.word-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  gap: 8px;
}

.word-language,
.word-topic {
  background: var(--border-light);
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-weight: 600;
  flex: 1;
  text-align: center;
}

/* Loading and Error States */
.loading-container,
.error-container,
.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-primary) !important;
}

.loading-container p,
.error-container p,
.empty-state p {
  color: var(--text-secondary) !important;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-light);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.error-container h3 {
  color: var(--danger-color);
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.retry-btn,
.clear-filters-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  margin-top: 24px;
  transition: all var(--transition-fast);
  font-weight: 600;
}

.retry-btn:hover,
.clear-filters-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 70px;
  height: 70px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.75rem;
  cursor: pointer;
  box-shadow: var(--shadow-xl);
  transition: all var(--transition-normal);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
}

.fab:active {
  transform: scale(0.95);
}

.fab-icon {
  transition: transform var(--transition-fast);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.add-word-modal {
  background: var(--background);
  border-radius: var(--border-radius-xl);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 0;
  margin-bottom: 32px;
}

.modal-header h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--border-light);
  transform: rotate(90deg);
}

/* Form Styles */
.add-word-form {
  padding: 0 32px 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: all var(--transition-fast);
  background: var(--background);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn-secondary,
.btn-primary {
  padding: 16px 32px;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 1rem;
  min-width: 120px;
}

.btn-secondary {
  background: var(--border-light);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: 2px solid transparent;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  transform: none;
}

/* Button Styles */
.test-btn {
  background: var(--gradient-primary);
  color: white !important;
  border: none;
  padding: 16px 32px;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 1rem;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Toast Notifications */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--secondary-color);
  color: white;
  padding: 16px 24px;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  z-index: 9999;
  animation: slideInRight 0.3s ease;
  box-shadow: var(--shadow-lg);
}

.toast.error {
  background: var(--danger-color);
}

.toast.info {
  background: var(--primary-color);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Enhanced Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Apply entrance animations */
.page-header {
  animation: slideInUp 0.8s ease 0.1s both;
}

.stat-card:nth-child(1) {
  animation: fadeInScale 0.6s ease 0.3s both;
}

.stat-card:nth-child(2) {
  animation: fadeInScale 0.6s ease 0.4s both;
}

.stat-card:nth-child(3) {
  animation: fadeInScale 0.6s ease 0.5s both;
}

.language-card:nth-child(1) {
  animation: slideInLeft 0.6s ease 0.6s both;
}

.language-card:nth-child(2) {
  animation: slideInLeft 0.6s ease 0.7s both;
}

.language-card:nth-child(3) {
  animation: slideInLeft 0.6s ease 0.8s both;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .vocabulary-page {
    padding: 24px 20px;
  }

  .languages-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  .action-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .topics-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .vocabulary-page {
    padding: 20px 16px;
  }

  .title-text {
    font-size: 2.5rem;
  }

  .page-subtitle {
    font-size: 1.125rem;
  }

  .quick-stats {
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: 400px;
  }

  .languages-grid {
    grid-template-columns: 1fr;
  }

  .language-card {
    padding: 24px;
  }

  .language-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .language-flag-large {
    font-size: 3rem;
  }

  .selected-language-title {
    font-size: 2rem;
  }

  .action-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .recent-words {
    grid-template-columns: 1fr;
  }

  .topics-grid {
    grid-template-columns: 1fr;
  }

  .controls {
    gap: 16px;
  }

  .filter-buttons {
    gap: 8px;
  }

  .filter-btn {
    padding: 8px 16px;
    font-size: 0.8rem;
  }

  .word-card {
    padding: 32px 24px;
    margin: 0 16px;
  }

  .word-main-display {
    font-size: 2.5rem;
  }

  .word-actions {
    flex-direction: column;
    align-items: center;
  }

  .nav-btn, .learn-btn {
    width: 100%;
    max-width: 200px;
  }

  .complete-stats {
    flex-direction: column;
    gap: 20px;
  }

  .results-stats {
    flex-direction: column;
    gap: 20px;
  }

  .question-options {
    grid-template-columns: 1fr;
  }

  .learning-controls {
    bottom: 20px;
    right: 20px;
  }

  .test-btn-floating {
    padding: 12px 16px;
    font-size: 0.9rem;
  }

  .question-word {
    padding: 24px;
  }

  .test-word {
    font-size: 2.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .fab {
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }

  .modal-header,
  .add-word-form {
    padding-left: 24px;
    padding-right: 24px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-primary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .title-text {
    font-size: 2rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }

  .language-stats {
    flex-direction: column;
    gap: 8px;
  }

  .word-meta {
    flex-direction: column;
    gap: 8px;
  }

  .word-language,
  .word-topic {
    text-align: center;
  }

  .topic-stats {
    gap: 6px;
  }

  .stat-badge {
    padding: 4px 8px;
    font-size: 0.8rem;
  }

  .learning-header {
    gap: 16px;
  }

  .learning-progress {
    flex-direction: column;
    gap: 8px;
  }

  .progress-bar-learning {
    max-width: 100%;
  }

  .word-main-display {
    font-size: 2rem;
  }

  .test-word {
    font-size: 2rem;
  }

  .option-btn {
    padding: 16px;
    min-height: 60px;
    font-size: 1rem;
  }

  .complete-actions,
  .results-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    max-width: 250px;
  }
}

/* Focus styles for accessibility */
.language-card:focus,
.action-card:focus,
.recent-word-card:focus,
.topic-card:focus,
.fab:focus {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --text-primary: #000000;
    --background: #ffffff;
  }

  .language-card,
  .stat-card,
  .action-card,
  .recent-word-card,
  .topic-card {
    border: 3px solid var(--text-primary);
  }
}

/* Print styles */
@media print {
  .fab,
  .modal-overlay {
    display: none !important;
  }

  .vocabulary-page {
    max-width: none;
    padding: 0;
  }

  .language-card,
  .stat-card,
  .action-card,
  .recent-word-card,
  .topic-card {
    box-shadow: none;
    border: 1px solid var(--border-color);
    break-inside: avoid;
  }
}
</style>