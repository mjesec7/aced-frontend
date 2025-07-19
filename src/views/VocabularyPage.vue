<template>
  <div class="vocabulary-page">
    <!-- Back Button (only show when viewing specific language) -->
    <button v-if="selectedLanguage" @click="goBackToLanguages" class="back-btn">
      ← Назад к языкам
    </button>

    <!-- Language Selection View -->
    <div v-if="!selectedLanguage">
      <!-- Compact Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-main">
            <h1 class="page-title">📚 Словарь</h1>
            <p class="page-subtitle">Выберите язык для изучения</p>
          </div>
          
          <!-- Quick Stats -->
          <div class="stats-bar" v-if="overallStats">
            <div class="stat">
              <span class="stat-number">{{ overallStats.totalWords || 0 }}</span>
              <span class="stat-label">всего слов</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ overallStats.languagesWithLessons || 0 }}</span>
              <span class="stat-label">языков из уроков</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ overallStats.mastered || 0 }}</span>
              <span class="stat-label">изучено</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Загрузка языков...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="fetchLanguageData" class="retry-btn">Повторить</button>
      </div>

      <!-- Languages Grid -->
      <div v-else class="languages-grid">
        <div 
          v-for="language in availableLanguages" 
          :key="language.code"
          class="language-card"
          :class="{ 'has-lessons': language.hasLessons }"
          @click="selectLanguage(language)"
        >
          <div class="lang-flag">{{ getLanguageFlag(language.code) }}</div>
          <div class="lang-info">
            <h3 class="lang-name">{{ language.nameRu || language.name }}</h3>
            <div class="lang-stats">
              <div class="stat-item" v-if="language.lessonsCount > 0">
                <span class="stat-icon">🎓</span>
                <span class="stat-text">{{ language.lessonsCount }} из уроков</span>
              </div>
              <div class="stat-item" v-if="language.otherCount > 0">
                <span class="stat-icon">📖</span>
                <span class="stat-text">{{ language.otherCount }} других</span>
              </div>
              <div class="stat-item" v-if="language.lessonsCount === 0 && language.otherCount === 0">
                <span class="stat-icon">🆕</span>
                <span class="stat-text">Начать изучение</span>
              </div>
            </div>
          </div>
          <div class="progress-indicator" v-if="language.totalWords > 0">
            <div class="progress-circle">
              <span class="progress-text">{{ language.progress }}%</span>
            </div>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="availableLanguages.length === 0" class="empty-state">
        <div class="empty-icon">🌍</div>
        <h3>Языки не найдены</h3>
        <p>Пройдите уроки или добавьте слова для изучения</p>
        <button @click="goToLessons" class="primary-btn">Перейти к урокам</button>
      </div>
    </div>

    <!-- Specific Language View -->
    <div v-else>
      <!-- Language Header -->
      <header class="language-header">
        <div class="lang-title-section">
          <span class="lang-flag-large">{{ getLanguageFlag(selectedLanguage.code) }}</span>
          <div class="lang-title-info">
            <h1 class="lang-title">{{ selectedLanguage.nameRu || selectedLanguage.name }}</h1>
            <p class="lang-subtitle">{{ getTotalWordsText() }}</p>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="lang-actions">
          <button class="action-btn primary" @click="createTest" v-if="hasAnyWords">
            <span class="btn-icon">🎯</span>
            <span>Тест</span>
          </button>
          <button class="action-btn" @click="reviewWords" v-if="wordsForReview > 0">
            <span class="btn-badge">{{ wordsForReview }}</span>
            <span class="btn-icon">🔄</span>
            <span>Повторить</span>
          </button>
        </div>
      </header>

      <!-- Loading State for Language -->
      <div v-if="languageLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Загрузка словаря...</span>
      </div>

      <!-- Language Content -->
      <div v-else class="language-content">
        
        <!-- From Lessons Section (only show if has lesson words) -->
        <section v-if="lessonWords.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">🎓 Из уроков</h2>
              <span class="section-count">{{ lessonWords.length }} слов</span>
            </div>
            <div class="section-actions">
              <button class="filter-btn" @click="toggleLessonFilter">
                <span class="filter-icon">📖</span>
                По урокам
              </button>
            </div>
          </div>

          <!-- Lesson Filter -->
          <div v-if="showLessonFilter" class="filter-bar">
            <button 
              v-for="lesson in uniqueLessons" 
              :key="lesson.id"
              @click="setLessonFilter(lesson.id)"
              class="lesson-filter"
              :class="{ active: lessonFilter === lesson.id }"
            >
              {{ lesson.title }}
            </button>
            <button @click="clearLessonFilter" class="clear-filter">Все</button>
          </div>

          <div class="vocabulary-grid">
            <div 
              v-for="word in filteredLessonWords" 
              :key="word.id"
              class="word-card lesson-word"
              @click="viewWord(word)"
            >
              <div class="word-header">
                <span class="word-main">{{ word.word }}</span>
                <span class="word-status" :class="word.status">
                  {{ getStatusIcon(word.status) }}
                </span>
              </div>
              <div class="word-translation">{{ word.translation }}</div>
              <div class="word-meta">
                <span class="word-lesson">{{ word.lessonTitle }}</span>
                <span class="word-date">{{ formatDate(word.dateAdded) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Other Vocabulary Section (manually added) -->
        <section v-if="otherWords.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">📖 Другие слова</h2>
              <span class="section-count">{{ otherWords.length }} слов</span>
            </div>
            <div class="section-actions">
              <button class="filter-btn" @click="toggleTopicFilter">
                <span class="filter-icon">🏷️</span>
                По темам
              </button>
            </div>
          </div>

          <!-- Topic Filter -->
          <div v-if="showTopicFilter" class="filter-bar">
            <button 
              v-for="topic in uniqueTopics" 
              :key="topic"
              @click="setTopicFilter(topic)"
              class="topic-filter"
              :class="{ active: topicFilter === topic }"
            >
              {{ topic }}
            </button>
            <button @click="clearTopicFilter" class="clear-filter">Все</button>
          </div>

          <div class="vocabulary-grid">
            <div 
              v-for="word in filteredOtherWords" 
              :key="word.id"
              class="word-card other-word"
              @click="viewWord(word)"
            >
              <div class="word-header">
                <span class="word-main">{{ word.word }}</span>
                <span class="word-status" :class="word.status">
                  {{ getStatusIcon(word.status) }}
                </span>
              </div>
              <div class="word-translation">{{ word.translation }}</div>
              <div class="word-meta">
                <span class="word-topic">{{ word.topic }}</span>
                <span class="word-difficulty" :class="word.difficulty">
                  {{ getDifficultyIcon(word.difficulty) }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Empty State for Selected Language -->
        <div v-if="lessonWords.length === 0 && otherWords.length === 0" class="empty-language-state">
          <div class="empty-icon">📚</div>
          <h3>Словарь пуст</h3>
          <p>Пройдите уроки на {{ selectedLanguage.nameRu || selectedLanguage.name }} или добавьте слова</p>
          <div class="empty-actions">
            <button @click="goToLessons" class="primary-btn">Найти уроки</button>
            <button @click="goToVocabularyLearning" class="secondary-btn">Изучать слова</button>
          </div>
        </div>
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
            <div class="detail-row" v-if="selectedWord.topic">
              <span class="detail-label">Тема:</span>
              <span class="detail-value">{{ selectedWord.topic }}</span>
            </div>
            <div class="detail-row" v-if="selectedWord.examples?.length > 0">
              <span class="detail-label">Пример:</span>
              <span class="detail-value">{{ selectedWord.examples[0].sentence }}</span>
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
    
    // Navigation state
    const selectedLanguage = ref(null);
    
    // Data
    const loading = ref(true);
    const languageLoading = ref(false);
    const error = ref('');
    const availableLanguages = ref([]);
    const overallStats = ref(null);
    
    // Language-specific data
    const lessonWords = ref([]);
    const otherWords = ref([]);
    const wordsForReview = ref(0);
    
    // Filters
    const showLessonFilter = ref(false);
    const showTopicFilter = ref(false);
    const lessonFilter = ref('');
    const topicFilter = ref('');
    
    // Modal
    const selectedWord = ref(null);
    const toastMessage = ref('');
    const toastType = ref('success');
    
    // Computed
    const currentUser = computed(() => store.getters.user);
    
    const uniqueLessons = computed(() => {
      const lessons = [...new Set(lessonWords.value.map(w => ({
        id: w.lessonId,
        title: w.lessonTitle
      })))];
      return lessons.filter(l => l.id && l.title);
    });
    
    const uniqueTopics = computed(() => {
      return [...new Set(otherWords.value.map(w => w.topic).filter(Boolean))];
    });
    
    const filteredLessonWords = computed(() => {
      if (!lessonFilter.value) return lessonWords.value;
      return lessonWords.value.filter(w => w.lessonId === lessonFilter.value);
    });
    
    const filteredOtherWords = computed(() => {
      if (!topicFilter.value) return otherWords.value;
      return otherWords.value.filter(w => w.topic === topicFilter.value);
    });
    
    const hasAnyWords = computed(() => {
      return lessonWords.value.length > 0 || otherWords.value.length > 0;
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

    const getDifficultyIcon = (difficulty) => {
      const icons = {
        beginner: '🟢',
        intermediate: '🟡',
        advanced: '🔴'
      };
      return icons[difficulty] || '⚪';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short' 
      });
    };

    const getTotalWordsText = () => {
      const total = lessonWords.value.length + otherWords.value.length;
      const lessonCount = lessonWords.value.length;
      const otherCount = otherWords.value.length;
      
      if (total === 0) return 'Нет слов';
      
      let text = `${total} слов`;
      if (lessonCount > 0 && otherCount > 0) {
        text += ` (${lessonCount} из уроков, ${otherCount} других)`;
      } else if (lessonCount > 0) {
        text += ` из уроков`;
      } else {
        text += ` для изучения`;
      }
      return text;
    };

    const showToast = (message, type = 'success') => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => { toastMessage.value = ''; }, 3000);
    };

    // Navigation methods
    const selectLanguage = async (language) => {
      selectedLanguage.value = language;
      await fetchLanguageVocabulary(language.code);
    };

    const goBackToLanguages = () => {
      selectedLanguage.value = null;
      lessonWords.value = [];
      otherWords.value = [];
      clearFilters();
    };

    // Filter methods
    const toggleLessonFilter = () => {
      showLessonFilter.value = !showLessonFilter.value;
      showTopicFilter.value = false;
    };

    const toggleTopicFilter = () => {
      showTopicFilter.value = !showTopicFilter.value;
      showLessonFilter.value = false;
    };

    const setLessonFilter = (lessonId) => {
      lessonFilter.value = lessonId;
      showLessonFilter.value = false;
    };

    const setTopicFilter = (topic) => {
      topicFilter.value = topic;
      showTopicFilter.value = false;
    };

    const clearLessonFilter = () => {
      lessonFilter.value = '';
      showLessonFilter.value = false;
    };

    const clearTopicFilter = () => {
      topicFilter.value = '';
      showTopicFilter.value = false;
    };

    const clearFilters = () => {
      lessonFilter.value = '';
      topicFilter.value = '';
      showLessonFilter.value = false;
      showTopicFilter.value = false;
    };

    // Action methods
    const viewWord = (word) => {
      selectedWord.value = word;
    };

    const closeWordModal = () => {
      selectedWord.value = null;
    };

    const pronounceWord = (word) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = selectedLanguage.value?.code === 'spanish' ? 'es-ES' : 'en-US';
        speechSynthesis.speak(utterance);
      }
      showToast(`🔊 ${word}`);
    };

    const markAsLearned = async (word) => {
      try {
        // Update word status locally
        const wordList = word.source === 'lesson' ? lessonWords.value : otherWords.value;
        const index = wordList.findIndex(w => w.id === word.id);
        if (index !== -1) {
          wordList[index].status = 'mastered';
        }

        // Update on server if user is logged in
        if (currentUser.value) {
          await fetch(`/api/vocabulary/progress/${currentUser.value.uid}/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              vocabularyId: word.id,
              correct: true,
              timeSpent: 0
            })
          });
        }

        showToast('Слово отмечено как изученное!');
        closeWordModal();
      } catch (error) {
        console.error('Error marking word as learned:', error);
        showToast('Ошибка при обновлении статуса', 'error');
      }
    };

    const createTest = () => {
      if (!hasAnyWords.value) {
        showToast('Сначала изучите слова', 'error');
        return;
      }
      
      // Navigate to VocabularyIn with test mode
      router.push({
        name: 'VocabularyIn',
        params: { languageCode: selectedLanguage.value.code },
        query: { mode: 'test', type: 'custom' }
      });
    };

    const reviewWords = () => {
      const wordsToReview = [...lessonWords.value, ...otherWords.value]
        .filter(w => w.status === 'learning' || w.status === 'reviewing');
      
      if (wordsToReview.length === 0) {
        showToast('Нет слов для повторения', 'error');
        return;
      }
      
      router.push({
        name: 'VocabularyIn',
        params: { languageCode: selectedLanguage.value.code },
        query: { mode: 'review' }
      });
    };

    const goToLessons = () => router.push('/profile/catalogue');

    const goToVocabularyLearning = () => {
      router.push({
        name: 'VocabularyIn',
        params: { languageCode: selectedLanguage.value.code }
      });
    };

    // API calls
    const fetchLanguageData = async () => {
      try {
        loading.value = true;
        error.value = '';

        if (!currentUser.value) {
          // Show default languages without any data - user needs to login
          availableLanguages.value = getDefaultLanguages();
          overallStats.value = { totalWords: 0, languagesWithLessons: 0, mastered: 0 };
          return;
        }

        // Fetch user's vocabulary statistics by language from backend
        const response = await fetch(`/api/vocabulary/user-languages/${currentUser.value.uid}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          availableLanguages.value = data.languages || [];
          overallStats.value = data.stats || { totalWords: 0, languagesWithLessons: 0, mastered: 0 };
        } else {
          throw new Error('Failed to fetch language data');
        }

      } catch (err) {
        console.error('Error fetching language data:', err);
        error.value = 'Не удалось загрузить данные языков';
        availableLanguages.value = [];
        overallStats.value = { totalWords: 0, languagesWithLessons: 0, mastered: 0 };
      } finally {
        loading.value = false;
      }
    };

    const fetchLanguageVocabulary = async (languageCode) => {
      try {
        languageLoading.value = true;
        lessonWords.value = [];
        otherWords.value = [];
        wordsForReview.value = 0;

        if (!currentUser.value) {
          showToast('Войдите в систему для просмотра словаря', 'error');
          return;
        }

        // Fetch vocabulary from lessons for this language
        const lessonsResponse = await fetch(`/api/vocabulary/from-lessons/${currentUser.value.uid}?language=${languageCode}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });

        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          lessonWords.value = lessonsData.data || [];
        } else if (lessonsResponse.status !== 404) {
          console.warn('Failed to fetch lesson vocabulary:', lessonsResponse.statusText);
        }

        // Fetch manually added vocabulary (admin panel words) for this language
        const otherResponse = await fetch(`/api/vocabulary/words/${languageCode}?source=manual&limit=100`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });

        if (otherResponse.ok) {
          const otherData = await otherResponse.json();
          otherWords.value = otherData.data || [];
        } else if (otherResponse.status !== 404) {
          console.warn('Failed to fetch manual vocabulary:', otherResponse.statusText);
        }

        // Calculate words for review from both sources
        wordsForReview.value = [...lessonWords.value, ...otherWords.value]
          .filter(w => w.status === 'learning' || w.status === 'reviewing').length;

      } catch (err) {
        console.error('Error fetching language vocabulary:', err);
        showToast('Не удалось загрузить словарь для выбранного языка', 'error');
        lessonWords.value = [];
        otherWords.value = [];
        wordsForReview.value = 0;
      } finally {
        languageLoading.value = false;
      }
    };

    // Helper functions
    const getDefaultLanguages = () => {
      return [
        { code: 'english', name: 'English', nameRu: 'Английский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'spanish', name: 'Spanish', nameRu: 'Испанский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'french', name: 'French', nameRu: 'Французский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'german', name: 'German', nameRu: 'Немецкий', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'chinese', name: 'Chinese', nameRu: 'Китайский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'japanese', name: 'Japanese', nameRu: 'Японский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'korean', name: 'Korean', nameRu: 'Корейский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 },
        { code: 'arabic', name: 'Arabic', nameRu: 'Арабский', hasLessons: false, lessonsCount: 0, otherCount: 0, totalWords: 0, progress: 0 }
      ];
    };

    // Watchers
    watch(currentUser, async (newUser) => {
      if (newUser) {
        await fetchLanguageData();
      } else {
        // User logged out, reset data
        availableLanguages.value = getDefaultLanguages();
        overallStats.value = { totalWords: 0, languagesWithLessons: 0, mastered: 0 };
        selectedLanguage.value = null;
        lessonWords.value = [];
        otherWords.value = [];
      }
    });

    // Lifecycle
    onMounted(() => {
      fetchLanguageData();
    });

    return {
      // Navigation state
      selectedLanguage,
      
      // Data
      loading,
      languageLoading,
      error,
      availableLanguages,
      overallStats,
      lessonWords,
      otherWords,
      wordsForReview,
      
      // Filters
      showLessonFilter,
      showTopicFilter,
      lessonFilter,
      topicFilter,
      
      // Modal
      selectedWord,
      toastMessage,
      toastType,
      
      // Computed
      uniqueLessons,
      uniqueTopics,
      filteredLessonWords,
      filteredOtherWords,
      hasAnyWords,
      
      // Methods
      getLanguageFlag,
      getLanguageName,
      getStatusIcon,
      getDifficultyIcon,
      formatDate,
      getTotalWordsText,
      selectLanguage,
      goBackToLanguages,
      toggleLessonFilter,
      toggleTopicFilter,
      setLessonFilter,
      setTopicFilter,
      clearLessonFilter,
      clearTopicFilter,
      viewWord,
      closeWordModal,
      pronounceWord,
      markAsLearned,
      createTest,
      reviewWords,
      goToLessons,
      goToVocabularyLearning,
      fetchLanguageData
    };
  }
};
</script>
<style scoped>
/* Variables */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  --success: #10b981;
  --success-dark: #059669;
  --warning: #f59e0b;
  --warning-dark: #d97706;
  --error: #ef4444;
  --error-dark: #dc2626;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --white: #ffffff;
  --black: #000000;
  --border-radius: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 20px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease;
  --transition-slow: all 0.3s ease;
}

/* Base Styles */
.vocabulary-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  position: relative;
}

.vocabulary-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(79, 70, 229, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* Back Button */
.back-btn {
  background: var(--white);
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
  padding: 10px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow);
}

.back-btn:hover {
  background: var(--gray-50);
  border-color: var(--primary);
  transform: translateX(-2px);
  box-shadow: var(--shadow-lg);
}

.back-btn:active {
  transform: translateX(-1px);
}

/* Headers */
.page-header,
.language-header {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(99, 102, 241, 0.1);
  position: relative;
  overflow: hidden;
}

.page-header::before,
.language-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

.header-content,
.lang-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-main,
.lang-title-info {
  flex: 1;
}

.page-title,
.lang-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.page-subtitle,
.lang-subtitle {
  margin: 4px 0 0 0;
  color: var(--gray-600);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.lang-flag-large {
  font-size: 48px;
  margin-right: 16px;
  animation: bounce 3s ease-in-out infinite;
}

.stats-bar,
.lang-actions {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.stat {
  text-align: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%);
  border-radius: var(--border-radius);
  border: 1px solid rgba(99, 102, 241, 0.2);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left 0.6s ease;
}

.stat:hover::before {
  left: 100%;
}

.stat:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Loading & Error States */
.loading-state, 
.error-state,
.empty-state,
.empty-language-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--gray-100);
  position: relative;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.error-icon,
.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.7;
  filter: grayscale(20%);
}

.error-state h3,
.empty-state h3,
.empty-language-state h3 {
  color: var(--gray-900);
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.error-state p,
.empty-state p,
.empty-language-state p {
  color: var(--gray-600);
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.retry-btn,
.primary-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin-top: 16px;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.retry-btn::before,
.primary-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.retry-btn:hover::before,
.primary-btn:hover::before {
  left: 100%;
}

.retry-btn:hover,
.primary-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

.retry-btn:active,
.primary-btn:active {
  transform: translateY(-1px) scale(0.98);
}

.secondary-btn {
  background: var(--white);
  color: var(--gray-700);
  border: 2px solid var(--gray-300);
  padding: 12px 24px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin: 8px;
  transition: var(--transition);
  box-shadow: var(--shadow);
}

.secondary-btn:hover {
  background: var(--gray-50);
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

/* Action Buttons */
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 2px solid var(--gray-200);
  padding: 12px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  position: relative;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  background: var(--gray-50);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

.action-btn.primary:hover {
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px) scale(1.02);
}

.btn-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, var(--error) 0%, var(--error-dark) 100%);
  color: white;
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.btn-icon {
  font-size: 16px;
  transition: transform var(--transition);
}

.action-btn:hover .btn-icon {
  transform: scale(1.1);
}

/* Languages Grid */
.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.language-card {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  padding: 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.language-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.language-card:hover::before {
  transform: scaleX(1);
}

.language-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary);
}

.language-card:active {
  transform: translateY(-4px) scale(0.98);
}

.language-card.has-lessons {
  border-left: 4px solid var(--success);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(5, 150, 105, 0.02) 100%);
}

.language-card.has-lessons::after {
  content: '🎓';
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 16px;
  background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: bold;
}

.lang-flag {
  font-size: 40px;
  margin-bottom: 16px;
  display: block;
  animation: float 6s ease-in-out infinite;
}

.lang-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 12px 0;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.lang-info {
  margin-bottom: 20px;
}

.lang-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--gray-600);
  background: var(--gray-50);
  padding: 8px 12px;
  border-radius: 8px;
  transition: var(--transition);
}

.language-card:hover .stat-item {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%);
  color: var(--primary);
}

.stat-icon {
  font-size: 16px;
  filter: grayscale(20%);
}

.stat-text {
  font-weight: 500;
}

.progress-indicator {
  position: absolute;
  top: 24px;
  right: 24px;
}

.progress-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(var(--primary) var(--progress, 0deg), var(--gray-200) 0deg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: progressSpin 2s ease-in-out;
}

.progress-circle::before {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: var(--white);
}

.progress-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
  position: relative;
  z-index: 1;
}

.card-arrow {
  position: absolute;
  bottom: 24px;
  right: 24px;
  font-size: 20px;
  color: var(--gray-400);
  transition: var(--transition-slow);
  background: var(--gray-100);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-card:hover .card-arrow {
  color: var(--white);
  background: var(--primary);
  transform: translateX(4px) scale(1.1);
}

/* Section Headers */
.language-content {
  animation: fadeInUp 0.6s ease;
}

.vocabulary-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--gray-100);
}

.section-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  line-height: 1.2;
}

.section-count {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.section-actions {
  display: flex;
  gap: 12px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gray-100);
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  color: var(--gray-700);
}

.filter-btn:hover {
  background: var(--gray-200);
  transform: translateY(-1px);
}

.filter-icon {
  font-size: 14px;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  padding: 16px;
  background: var(--gray-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
}

.lesson-filter,
.topic-filter {
  background: var(--white);
  border: 2px solid var(--gray-200);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  color: var(--gray-700);
  box-shadow: var(--shadow);
}

.lesson-filter:hover,
.topic-filter:hover {
  border-color: var(--primary);
  background: var(--gray-50);
  transform: translateY(-1px);
}

.lesson-filter.active,
.topic-filter.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

.clear-filter {
  background: var(--gray-200);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: var(--gray-600);
  font-weight: 500;
  transition: var(--transition);
}

.clear-filter:hover {
  background: var(--gray-300);
  color: var(--gray-800);
}

/* Vocabulary Grid */
.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.word-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid var(--gray-200);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.word-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--gray-300);
  transition: all 0.3s ease;
}

.word-card:hover {
  transform: translateY(-4px) translateX(4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary);
}

.word-card:hover::before {
  width: 6px;
  background: var(--primary);
}

.word-card.lesson-word::before {
  background: linear-gradient(180deg, var(--success) 0%, var(--success-dark) 100%);
}

.word-card.other-word::before {
  background: linear-gradient(180deg, var(--warning) 0%, var(--warning-dark) 100%);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.word-main {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
}

.word-status {
  font-size: 18px;
  transition: transform var(--transition);
}

.word-card:hover .word-status {
  transform: scale(1.2);
}

.word-translation {
  color: var(--gray-600);
  margin-bottom: 16px;
  font-style: italic;
  font-size: 16px;
  line-height: 1.4;
}

.word-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.word-lesson,
.word-topic {
  font-size: 11px;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.word-lesson {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: var(--success-dark);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.word-topic {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
  color: var(--warning-dark);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.word-date,
.word-difficulty {
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
}

/* Word Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: modalFadeIn 0.3s ease;
}

.word-modal {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--gray-200);
  animation: modalSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 2px solid var(--gray-100);
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%);
}

.modal-header h3 {
  margin: 0;
  color: var(--gray-900);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.close-btn {
  background: var(--gray-100);
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--gray-500);
  padding: 8px;
  border-radius: 8px;
  transition: var(--transition);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-700);
  transform: scale(1.1);
}

.modal-content {
  padding: 28px;
}

.word-details {
  margin-bottom: 28px;
}

.detail-row {
  display: flex;
  margin-bottom: 16px;
  gap: 16px;
  align-items: flex-start;
}

.detail-label {
  font-weight: 600;
  color: var(--gray-700);
  min-width: 120px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: var(--gray-900);
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.modal-btn {
  background: var(--gray-100);
  border: none;
  padding: 12px 20px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  color: var(--gray-700);
}

.modal-btn:hover {
  background: var(--gray-200);
  transform: translateY(-1px);
}

.modal-btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

.modal-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

/* Toast */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: var(--gray-900);
  color: white;
  padding: 16px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  z-index: 1001;
  animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  max-width: 350px;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(8px);
}
</style>