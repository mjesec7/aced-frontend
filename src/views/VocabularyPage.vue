<template>
  <div class="vocabulary-page">
    <!-- Compact Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-main">
          <h1 class="page-title">📚 Словарь</h1>
          <p class="page-subtitle">Управляйте своим словарным запасом</p>
        </div>
        
        <!-- Quick Stats -->
        <div class="stats-bar" v-if="stats">
          <div class="stat">
            <span class="stat-number">{{ stats.totalWords || 0 }}</span>
            <span class="stat-label">всего</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ stats.fromLessons || 0 }}</span>
            <span class="stat-label">из уроков</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ stats.mastered || 0 }}</span>
            <span class="stat-label">изучено</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>Загрузка словаря...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-btn">Повторить</button>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      
      <!-- Quick Actions -->
      <section class="quick-actions">
        <button class="action-btn primary" @click="createCustomTest">
          <span class="btn-icon">🎯</span>
          <span>Создать тест</span>
        </button>
        
        <button class="action-btn" @click="reviewWords" v-if="wordsForReview > 0">
          <span class="btn-badge">{{ wordsForReview }}</span>
          <span class="btn-icon">🔄</span>
          <span>Повторить</span>
        </button>
        
        <button class="action-btn" @click="viewProgress">
          <span class="btn-icon">📊</span>
          <span>Прогресс</span>
        </button>
      </section>

      <!-- Vocabulary from Lessons Section -->
      <section class="vocabulary-section" v-if="lessonVocabulary.length > 0">
        <div class="section-header">
          <div class="section-info">
            <h2 class="section-title">🎓 Словарь из уроков</h2>
            <span class="section-count">{{ lessonVocabulary.length }} слов</span>
          </div>
          <div class="section-actions">
            <button class="filter-btn" @click="toggleLessonFilter">
              <span class="filter-icon">🔍</span>
              Фильтр
            </button>
          </div>
        </div>

        <!-- Language Filter for Lesson Vocabulary -->
        <div v-if="showLessonFilter" class="filter-bar">
          <button 
            v-for="lang in lessonLanguages" 
            :key="lang.code"
            @click="setLessonLanguageFilter(lang.code)"
            class="lang-filter"
            :class="{ active: lessonLanguageFilter === lang.code }"
          >
            {{ lang.flag }} {{ lang.name }}
          </button>
          <button @click="clearLessonFilter" class="clear-filter">Все</button>
        </div>

        <div class="vocabulary-grid">
          <div 
            v-for="word in filteredLessonVocabulary" 
            :key="word.id"
            class="word-card lesson-word"
            @click="viewWord(word)"
          >
            <div class="word-header">
              <span class="word-main">{{ word.word }}</span>
              <span class="word-lang">{{ getLanguageFlag(word.language) }}</span>
            </div>
            <div class="word-translation">{{ word.translation }}</div>
            <div class="word-meta">
              <span class="word-lesson">{{ word.lessonTitle }}</span>
              <span class="word-status" :class="word.status">
                {{ getStatusIcon(word.status) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Languages for Vocabulary Learning Section -->
      <section class="vocabulary-section">
        <div class="section-header">
          <div class="section-info">
            <h2 class="section-title">🌍 Изучение по языкам</h2>
            <span class="section-count">{{ languages.length }} языков</span>
          </div>
        </div>

        <div class="languages-grid">
          <div 
            v-for="language in languages" 
            :key="language.code"
            class="language-card"
            @click="selectLanguage(language)"
          >
            <div class="lang-flag">{{ getLanguageFlag(language.code) }}</div>
            <div class="lang-info">
              <h3 class="lang-name">{{ language.nameRu || language.name }}</h3>
              <div class="lang-stats">
                <span class="lang-count">{{ getLanguageWordCount(language.code) }} слов</span>
                <span class="lang-progress">{{ getLanguageProgress(language.code) }}%</span>
              </div>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getLanguageProgress(language.code) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="lessonVocabulary.length === 0 && languages.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <h3>Словарь пуст</h3>
        <p>Пройдите уроки или добавьте слова для изучения</p>
        <button @click="goToLessons" class="primary-btn">Перейти к урокам</button>
      </div>
    </div>

    <!-- Word Details Modal -->
    <div v-if="selectedWord" class="modal-overlay" @click="closeWordModal">
      <div class="word-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedWord.word }}</h3>
          <button @click="closeWordModal" class="close-btn">✕</button>
        </div>
        <div class="modal-content">
          <div class="word-details">
            <div class="detail-row">
              <span class="detail-label">Перевод:</span>
              <span class="detail-value">{{ selectedWord.translation }}</span>
            </div>
            <div class="detail-row" v-if="selectedWord.pronunciation">
              <span class="detail-label">Произношение:</span>
              <span class="detail-value">{{ selectedWord.pronunciation }}</span>
            </div>
            <div class="detail-row" v-if="selectedWord.lessonTitle">
              <span class="detail-label">Урок:</span>
              <span class="detail-value">{{ selectedWord.lessonTitle }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Язык:</span>
              <span class="detail-value">{{ getLanguageFlag(selectedWord.language) }} {{ getLanguageName(selectedWord.language) }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="pronounceWord(selectedWord.word)" class="modal-btn">
              🔊 Произнести
            </button>
            <button @click="markAsLearned(selectedWord)" class="modal-btn primary" v-if="selectedWord.status !== 'mastered'">
              ✅ Изучено
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'VocabularyPage',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Data
    const loading = ref(true);
    const error = ref('');
    const lessonVocabulary = ref([]);
    const languages = ref([]);
    const stats = ref(null);
    const wordsForReview = ref(0);
    const selectedWord = ref(null);
    const toastMessage = ref('');
    const toastType = ref('success');
    
    // Filters
    const showLessonFilter = ref(false);
    const lessonLanguageFilter = ref('');
    
    // Computed
    const currentUser = computed(() => store.getters.user);
    
    const lessonLanguages = computed(() => {
      const langs = [...new Set(lessonVocabulary.value.map(w => w.language))];
      return langs.map(lang => ({
        code: lang,
        name: getLanguageName(lang),
        flag: getLanguageFlag(lang)
      }));
    });
    
    const filteredLessonVocabulary = computed(() => {
      if (!lessonLanguageFilter.value) return lessonVocabulary.value;
      return lessonVocabulary.value.filter(w => w.language === lessonLanguageFilter.value);
    });

    // Methods
    const getLanguageFlag = (code) => {
      const flags = {
        english: '🇺🇸', spanish: '🇪🇸', french: '🇫🇷', german: '🇩🇪',
        chinese: '🇨🇳', arabic: '🇸🇦', japanese: '🇯🇵', korean: '🇰🇷',
        uzbek: '🇺🇿', russian: '🇷🇺'
      };
      return flags[code] || '🌐';
    };

    const getLanguageName = (code) => {
      const names = {
        english: 'Английский', spanish: 'Испанский', french: 'Французский',
        german: 'Немецкий', chinese: 'Китайский', arabic: 'Арабский',
        japanese: 'Японский', korean: 'Корейский', uzbek: 'Узбекский',
        russian: 'Русский'
      };
      return names[code] || code;
    };

    const getStatusIcon = (status) => {
      const icons = {
        new: '🆕',
        learning: '📖',
        reviewing: '🔄',
        mastered: '✅'
      };
      return icons[status] || '📝';
    };

    const getLanguageWordCount = (languageCode) => {
      const count = lessonVocabulary.value.filter(w => w.language === languageCode).length;
      return count || 8; // Default fallback
    };

    const getLanguageProgress = (languageCode) => {
      const words = lessonVocabulary.value.filter(w => w.language === languageCode);
      if (words.length === 0) return 0;
      const mastered = words.filter(w => w.status === 'mastered').length;
      return Math.round((mastered / words.length) * 100);
    };

    const showToast = (message, type = 'success') => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => { toastMessage.value = ''; }, 3000);
    };

    // Filter methods
    const toggleLessonFilter = () => {
      showLessonFilter.value = !showLessonFilter.value;
    };

    const setLessonLanguageFilter = (langCode) => {
      lessonLanguageFilter.value = langCode;
      showLessonFilter.value = false;
    };

    const clearLessonFilter = () => {
      lessonLanguageFilter.value = '';
      showLessonFilter.value = false;
    };

    // Action methods
    const selectLanguage = (language) => {
      router.push({
        name: 'VocabularyIn',
        params: { languageCode: language.code }
      });
    };

    const viewWord = (word) => {
      selectedWord.value = word;
    };

    const closeWordModal = () => {
      selectedWord.value = null;
    };

    const pronounceWord = (word) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      showToast(`🔊 ${word}`);
    };

    const markAsLearned = (word) => {
      // Update word status
      const index = lessonVocabulary.value.findIndex(w => w.id === word.id);
      if (index !== -1) {
        lessonVocabulary.value[index].status = 'mastered';
      }
      showToast('Слово отмечено как изученное!');
      closeWordModal();
    };

    const createCustomTest = () => {
      if (lessonVocabulary.value.length === 0) {
        showToast('Сначала изучите слова в уроках', 'error');
        return;
      }
      showToast('Создание теста скоро будет доступно!');
    };

    const reviewWords = () => showToast('Повторение слов скоро будет доступно!');
    const viewProgress = () => showToast('Просмотр прогресса скоро будет доступен!');
    const goToLessons = () => router.push('/profile/catalogue');

    // API calls
    const fetchLessonVocabulary = async () => {
      if (!currentUser.value) return;
      
      try {
        // Fetch vocabulary from lessons
        const response = await fetch(`/api/vocabulary/from-lessons/${currentUser.value.uid}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          lessonVocabulary.value = data.data || [];
        } else {
          // Fallback: generate sample data
          lessonVocabulary.value = generateSampleLessonVocabulary();
        }
      } catch (err) {
        console.error('Error fetching lesson vocabulary:', err);
        lessonVocabulary.value = generateSampleLessonVocabulary();
      }
    };

    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/vocabulary/languages');
        if (response.ok) {
          const data = await response.json();
          languages.value = data.data || getDefaultLanguages();
        } else {
          languages.value = getDefaultLanguages();
        }
      } catch (err) {
        console.error('Error fetching languages:', err);
        languages.value = getDefaultLanguages();
      }
    };

    const fetchStats = async () => {
      const totalWords = lessonVocabulary.value.length;
      const fromLessons = lessonVocabulary.value.length;
      const mastered = lessonVocabulary.value.filter(w => w.status === 'mastered').length;
      
      stats.value = {
        totalWords,
        fromLessons,
        mastered
      };
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        await Promise.all([
          fetchLessonVocabulary(),
          fetchLanguages()
        ]);
        
        await fetchStats();
        
        // Set words for review
        wordsForReview.value = lessonVocabulary.value.filter(w => 
          w.status === 'learning' || w.status === 'reviewing'
        ).length;
        
      } catch (err) {
        console.error('Error fetching vocabulary data:', err);
        error.value = 'Не удалось загрузить данные словаря';
      } finally {
        loading.value = false;
      }
    };

    // Helper functions
    const generateSampleLessonVocabulary = () => {
      return [
        {
          id: '1',
          word: 'hello',
          translation: 'привет',
          language: 'english',
          lessonTitle: 'Урок 1: Приветствие',
          status: 'mastered',
          pronunciation: '/həˈloʊ/'
        },
        {
          id: '2',
          word: 'goodbye',
          translation: 'до свидания',
          language: 'english',
          lessonTitle: 'Урок 1: Приветствие',
          status: 'learning'
        },
        {
          id: '3',
          word: 'thank you',
          translation: 'спасибо',
          language: 'english',
          lessonTitle: 'Урок 2: Вежливость',
          status: 'reviewing'
        },
        {
          id: '4',
          word: 'hola',
          translation: 'привет',
          language: 'spanish',
          lessonTitle: 'Урок 1: Испанские приветствия',
          status: 'new'
        },
        {
          id: '5',
          word: 'gracias',
          translation: 'спасибо',
          language: 'spanish',
          lessonTitle: 'Урок 1: Испанские приветствия',
          status: 'learning'
        }
      ];
    };

    const getDefaultLanguages = () => {
      return [
        { code: 'english', name: 'English', nameRu: 'Английский' },
        { code: 'spanish', name: 'Spanish', nameRu: 'Испанский' },
        { code: 'french', name: 'French', nameRu: 'Французский' },
        { code: 'german', name: 'German', nameRu: 'Немецкий' }
      ];
    };

    // Watchers
    watch(currentUser, async (newUser) => {
      if (newUser) {
        await fetchLessonVocabulary();
        await fetchStats();
      }
    });

    // Lifecycle
    onMounted(() => {
      fetchData();
    });

    return {
      loading,
      error,
      lessonVocabulary,
      languages,
      stats,
      wordsForReview,
      selectedWord,
      toastMessage,
      toastType,
      showLessonFilter,
      lessonLanguageFilter,
      lessonLanguages,
      filteredLessonVocabulary,
      
      // Methods
      getLanguageFlag,
      getLanguageName,
      getStatusIcon,
      getLanguageWordCount,
      getLanguageProgress,
      toggleLessonFilter,
      setLessonLanguageFilter,
      clearLessonFilter,
      selectLanguage,
      viewWord,
      closeWordModal,
      pronounceWord,
      markAsLearned,
      createCustomTest,
      reviewWords,
      viewProgress,
      goToLessons,
      fetchData
    };
  }
};
</script>

<style scoped>
/* Variables */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-900: #111827;
  --white: #ffffff;
  --border-radius: 12px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Base */
.vocabulary-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', system-ui, sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* Compact Header */
.page-header {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-main h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900);
}

.page-subtitle {
  margin: 4px 0 0 0;
  color: var(--gray-600);
  font-size: 14px;
}

.stats-bar {
  display: flex;
  gap: 24px;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Loading & Error States */
.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 16px;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  padding: 12px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.action-btn:hover {
  background: var(--gray-50);
  border-color: var(--primary);
}

.action-btn.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.action-btn.primary:hover {
  background: var(--primary-dark);
}

.btn-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--error);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.btn-icon {
  font-size: 16px;
}

/* Section Headers */
.vocabulary-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.section-count {
  background: var(--gray-100);
  color: var(--gray-600);
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--gray-100);
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.lang-filter {
  background: var(--white);
  border: 1px solid var(--gray-200);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.lang-filter:hover,
.lang-filter.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.clear-filter {
  background: var(--gray-100);
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
}

/* Vocabulary Grid */
.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.word-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
}

.word-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.word-card.lesson-word {
  border-left: 4px solid var(--primary);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.word-main {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-900);
}

.word-lang {
  font-size: 20px;
}

.word-translation {
  color: var(--gray-600);
  margin-bottom: 12px;
  font-style: italic;
}

.word-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-lesson {
  font-size: 12px;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 4px 8px;
  border-radius: 6px;
}

.word-status {
  font-size: 16px;
}

/* Languages Grid */
.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.language-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
  position: relative;
  overflow: hidden;
}

.language-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.language-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--primary);
  transform: scaleX(0);
  transition: transform 0.2s;
}

.language-card:hover::before {
  transform: scaleX(1);
}

.lang-flag {
  font-size: 32px;
  margin-bottom: 12px;
}

.lang-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 8px 0;
}

.lang-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.lang-count,
.lang-progress {
  font-size: 12px;
  color: var(--gray-600);
}

.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  color: var(--gray-900);
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--gray-600);
  margin-bottom: 24px;
}

.primary-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
}

/* Word Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.word-modal {
  background: var(--white);
  border-radius: var(--border-radius);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  margin: 0;
  color: var(--gray-900);
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--gray-500);
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--gray-100);
}

.modal-content {
  padding: 24px;
}

.word-details {
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  gap: 12px;
}

.detail-label {
  font-weight: 500;
  color: var(--gray-700);
  min-width: 100px;
}

.detail-value {
  color: var(--gray-900);
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  background: var(--gray-100);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-btn:hover {
  background: var(--gray-200);
}

.modal-btn.primary {
  background: var(--primary);
  color: white;
}

.modal-btn.primary:hover {
  background: var(--primary-dark);
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--gray-900);
  color: white;
  padding: 12px 16px;
  border-radius: var(--border-radius);
  font-size: 14px;
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
  max-width: 300px;
}

.toast.success {
  background: var(--success);
}

.toast.error {
  background: var(--error);
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .vocabulary-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .stats-bar {
    gap: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quick-actions {
    flex-direction: column;
  }

  .action-btn {
    justify-content: center;
  }

  .vocabulary-grid,
  .languages-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    justify-content: center;
  }

  .word-modal {
    width: 95%;
    margin: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .vocabulary-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .header-main h1 {
    font-size: 24px;
  }

  .stats-bar {
    flex-direction: column;
    gap: 8px;
  }

  .section-title {
    font-size: 18px;
  }

  .word-card,
  .language-card {
    padding: 12px;
  }

  .word-main {
    font-size: 16px;
  }

  .lang-flag {
    font-size: 24px;
  }

  .toast {
    left: 12px;
    right: 12px;
    top: 12px;
    max-width: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --white: #1f2937;
    --gray-50: #374151;
    --gray-100: #4b5563;
    --gray-200: #6b7280;
    --gray-300: #9ca3af;
    --gray-500: #d1d5db;
    --gray-600: #e5e7eb;
    --gray-700: #f3f4f6;
    --gray-900: #ffffff;
  }

  .vocabulary-page {
    background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  }
}

/* Accessibility */
.action-btn:focus,
.word-card:focus,
.language-card:focus,
.modal-btn:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>