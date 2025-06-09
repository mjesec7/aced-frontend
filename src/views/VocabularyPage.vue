getTopicPlural,
      getWordPlural,
      getSubtopicPlural,    // Russian pluralization for subtopics/sections
    const getSubtopicPlural = (count) => {
      if (count % 10 === 1 && count % 100 !== 11) return 'раздел';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'раздела';
      return 'разделов';
    };      getSelectedLanguageName,
      getLanguageNameRu,
      getTopicNameRu,
      toggleDifficulty,    const filteredTopics = computed(() => {
      let filtered = [...topics.value]; // Create a copy to avoid mutating original
      
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
          (topic.difficulty || 'beginner') === selectedDifficulty.value<template>
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
        <section class="languages-section" v-if="!selectedLanguage">
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

        <!-- Topics Section (if language is selected) -->
        <section v-if="selectedLanguage" class="topics-section">
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
                    <span>{{ topic.wordCount || 0 }} {{ getWordPlural(topic.wordCount || 0) }}</span>
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

        <!-- Quick Actions (only show when no language selected) -->
        <section class="quick-actions" v-if="!selectedLanguage">
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

        <!-- Recent Activity (only show when no language selected) -->
        <section class="recent-activity" v-if="!selectedLanguage && recentWords.length > 0">
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
  name: 'VocabularyPage', // ✅ UPDATED: Renamed from ProfileVocabularyPage
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
    const topics = ref([]);
    const topicsLoading = ref(false);
    const searchQuery = ref('');
    const selectedDifficulty = ref('');

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
      let filtered = [...topics.value]; // Create a copy to avoid mutating original
      
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

    const getLanguageTopicCount = (languageCode) => {
      const wordsInLanguage = recentWords.value.filter(w => w.language === languageCode);
      const uniqueTopics = [...new Set(wordsInLanguage.map(w => w.topic))];
      const count = uniqueTopics.length || 1;
      return `${count} ${getTopicPlural(count)}`;
    };

    // Russian pluralization for topics
    const getTopicPlural = (count) => {
      if (count % 10 === 1 && count % 100 !== 11) return 'тема';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'темы';
      return 'тем';
    };

    // Russian pluralization for words
    const getWordPlural = (count) => {
      if (count % 10 === 1 && count % 100 !== 11) return 'слово';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'слова';
      return 'слов';
    };

    const getLanguageWordCount = (languageCode) => {
      if (!stats.value || !stats.value.byLanguage) return '0 слов';
      const langStat = stats.value.byLanguage.find(l => l._id === languageCode);
      const count = langStat ? langStat.count : 0;
      return `${count} ${getWordPlural(count)}`;
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
      await fetchTopics(language.code);
    };

    const goBackToLanguages = () => {
      selectedLanguage.value = '';
      topics.value = [];
      searchQuery.value = '';
      selectedDifficulty.value = '';
    };

    const selectTopic = (topic) => {
      console.log('📖 Выбрана тема:', topic.name);
      showToast(`Выбрано: ${getTopicNameRu(topic.name)} (${topic.wordCount || 0} слов)`);
      // Don't change the view, just show feedback
      // Later we can add navigation to subtopics or word lists
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
        
        const response = await getVocabularyTopics(languageCode);
        topics.value = response.data || [];
        
        console.log('✅ Topics fetched:', topics.value.length, 'topics');
        
      } catch (err) {
        console.error('❌ Error fetching topics:', err);
        topics.value = [];
      } finally {
        topicsLoading.value = false;
      }
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
      console.log('🎯 ProfileVocabularyPage mounted');
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
      topics,
      topicsLoading,
      searchQuery,
      selectedDifficulty,
      difficultyLevels,
      filteredTopics,
      
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
      selectLanguage,
      goBackToLanguages,
      selectTopic,
      clearFilters,
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

.language-name-ru {
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