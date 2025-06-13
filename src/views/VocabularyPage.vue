<template>
  <div class="vocabulary-page">
    <!-- Header Section -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-icon">📚</div>
        <h1 class="page-title">Изучение Словаря</h1>
        <p class="page-subtitle">Овладевайте языками через умное построение словарного запаса</p>
        
        <!-- Compact Stats -->
        <div class="stats-grid" v-if="stats">
          <div class="stat-item">
            <div class="stat-icon">📖</div>
            <span class="stat-value">{{ stats.totalWords || 0 }}</span>
            <span class="stat-label">Слов</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🎯</div>
            <span class="stat-value">{{ userProgress?.wordsLearned || 0 }}</span>
            <span class="stat-label">Изучено</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">⚡</div>
            <span class="stat-value">{{ userProgress?.accuracy || 0 }}%</span>
            <span class="stat-label">Точность</span>
          </div>
        </div>
      </div>
      <div class="header-decoration"></div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <span>Загрузка данных словаря...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Что-то пошло не так</h3>
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-btn">Попробовать снова</button>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Languages Grid -->
      <section class="languages-section">
        <div class="section-header">
          <h2 class="section-title">Доступные языки</h2>
          <div class="section-decoration"></div>
        </div>
        <div class="languages-grid">
          <div 
            v-for="language in languages" 
            :key="language.code"
            class="language-card"
            :class="{ popular: language.isPopular }"
            @click="selectLanguage(language)"
          >
            <div class="card-glow"></div>
            <div class="card-header">
              <span class="language-flag">{{ getLanguageFlag(language.code) }}</span>
              <div v-if="language.isPopular" class="popular-badge">
                <span class="badge-icon">⭐</span>
                Популярный
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="language-name">{{ language.nameRu || language.name }}</h3>
              <p class="language-subtitle">{{ language.name }}</p>
              
              <div class="language-meta">
                <div class="meta-item">
                  <div class="meta-icon">📝</div>
                  <span>{{ getLanguageWordCount(language.code) }}</span>
                </div>
                <div class="meta-item">
                  <div class="meta-icon">📚</div>
                  <span>{{ getLanguageTopicCount(language.code) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Progress Circle -->
            <div class="progress-circle">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path
                  class="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="circle"
                  :stroke-dasharray="`${getLanguageProgress(language.code)}, 100`"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" class="percentage">{{ Math.round(getLanguageProgress(language.code)) }}%</text>
              </svg>
            </div>
            
            <div class="card-action">
              <div class="action-text">Изучать</div>
              <div class="action-arrow">→</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <div class="section-header">
          <h2 class="section-title">Быстрые действия</h2>
          <div class="section-decoration"></div>
        </div>
        <div class="actions-grid">
          <button class="action-btn primary" @click="openCreateTestModal">
            <div class="btn-icon">🎯</div>
            <div class="btn-content">
              <span class="btn-title">Создать тест</span>
              <span class="btn-subtitle">Персональная практика</span>
            </div>
            <div class="btn-arrow">→</div>
          </button>
          
          <button class="action-btn" @click="reviewWords" v-if="wordsForReview > 0">
            <div class="btn-badge">{{ wordsForReview }}</div>
            <div class="btn-icon">📚</div>
            <div class="btn-content">
              <span class="btn-title">Повторить</span>
              <span class="btn-subtitle">Слова на повторение</span>
            </div>
            <div class="btn-arrow">→</div>
          </button>
          
          <button class="action-btn" @click="viewProgress">
            <div class="btn-icon">📊</div>
            <div class="btn-content">
              <span class="btn-title">Прогресс</span>
              <span class="btn-subtitle">Статистика обучения</span>
            </div>
            <div class="btn-arrow">→</div>
          </button>
          
          <button class="action-btn" @click="viewAchievements">
            <div class="btn-icon">🏆</div>
            <div class="btn-content">
              <span class="btn-title">Достижения</span>
              <span class="btn-subtitle">Ваши награды</span>
            </div>
            <div class="btn-arrow">→</div>
          </button>
        </div>
      </section>

      <!-- Recent Words -->
      <section class="recent-words" v-if="recentWords.length > 0">
        <div class="section-header">
          <h2 class="section-title">Недавно добавленные</h2>
          <div class="section-decoration"></div>
        </div>
        <div class="words-grid">
          <div 
            v-for="word in recentWords" 
            :key="word._id"
            class="word-card"
            @click="viewWord(word)"
          >
            <div class="word-main">{{ word.word }}</div>
            <div class="word-translation">{{ word.translation }}</div>
            <div class="word-tags">
              <span class="tag language">{{ getLanguageNameRu(word.language) }}</span>
              <span class="tag topic">{{ word.topic }}</span>
            </div>
            <div class="word-hover">
              <div class="hover-icon">👁️</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Create Test Modal -->
    <CreateTestModal 
      v-if="showCreateTestModal"
      :languages="languages"
      @close="closeCreateTestModal"
      @create="createTest"
    />

    <!-- Toast -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <div class="toast-icon">
        {{ toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : 'ℹ️' }}
      </div>
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import CreateTestModal from '../components/Modals/CreateTestModal.vue';
import {
  getVocabularyLanguages,
  getVocabularyStats,
  getUserVocabularyProgress,
  getWordsForReview,
  searchVocabulary
} from '@/api/vocabulary';

export default {
  name: 'VocabularyPage',
  components: {
    CreateTestModal
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Data
    const loading = ref(true);
    const error = ref('');
    const languages = ref([]);
    const stats = ref(null);
    const userProgress = ref(null);
    const recentWords = ref([]);
    const wordsForReview = ref(0);
    const toastMessage = ref('');
    const toastType = ref('success');
    const showCreateTestModal = ref(false);

    // Computed
    const currentUser = computed(() => store.getters.user);

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

    const getLanguageNameRu = (code) => {
      const language = languages.value.find(l => l.code === code);
      return language ? (language.nameRu || language.name) : code;
    };

    const getLanguageProgress = (languageCode) => {
      if (!userProgress.value || !userProgress.value.byLanguage) return 0;
      const langProgress = userProgress.value.byLanguage[languageCode];
      return langProgress ? langProgress.percentage : 0;
    };

    const getLanguageWordCount = (languageCode) => {
      if (!stats.value || !stats.value.byLanguage) return '8 слов';
      const langStat = stats.value.byLanguage.find(l => l._id === languageCode);
      const count = langStat ? langStat.count : 8;
      return `${count} слов`;
    };

    const getLanguageTopicCount = (languageCode) => {
      return '3 темы';
    };

    const showToast = (message, type = 'success') => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => { toastMessage.value = ''; }, 3000);
    };

    const selectLanguage = (language) => {
      router.push({
        name: 'VocabularyIn',
        params: { languageCode: language.code }
      });
    };

    const openCreateTestModal = () => {
      if (!currentUser.value) {
        showToast('Пожалуйста, войдите в систему для создания теста', 'error');
        return;
      }
      showCreateTestModal.value = true;
    };

    const closeCreateTestModal = () => {
      showCreateTestModal.value = false;
    };

    const createTest = (testConfig) => {
      router.push({
        name: 'VocabularyIn',
        params: { languageCode: testConfig.language },
        query: { 
          mode: 'test',
          type: testConfig.type,
          topics: testConfig.topics?.join(','),
          count: testConfig.wordCount
        }
      });
    };

    const reviewWords = () => showToast('Функция повторения скоро появится!');
    const viewProgress = () => showToast('Функция прогресса скоро появится!');
    const viewAchievements = () => showToast('Функция достижений скоро появится!');
    const viewWord = (word) => showToast(`Просмотр: ${word.word} - ${word.translation}`);

    // API calls
    const fetchLanguages = async () => {
      try {
        const response = await getVocabularyLanguages();
        
        let languageData = [];
        if (response && response.data) {
          languageData = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          languageData = response;
        }
        
        if (languageData.length === 0) {
          languageData = [
            { code: 'english', name: 'English', nameRu: 'Английский' },
            { code: 'spanish', name: 'Spanish', nameRu: 'Испанский' },
            { code: 'french', name: 'French', nameRu: 'Французский' },
            { code: 'german', name: 'German', nameRu: 'Немецкий' },
            { code: 'chinese', name: 'Chinese', nameRu: 'Китайский' },
            { code: 'arabic', name: 'Arabic', nameRu: 'Арабский' },
            { code: 'japanese', name: 'Japanese', nameRu: 'Японский' },
            { code: 'korean', name: 'Korean', nameRu: 'Корейский' }
          ];
        }
        
        languages.value = languageData.map(lang => ({
          ...lang,
          isPopular: ['english', 'spanish', 'french'].includes(lang.code)
        }));
        
      } catch (err) {
        console.error('Error fetching languages:', err);
        languages.value = [
          { code: 'english', name: 'English', nameRu: 'Английский', isPopular: true },
          { code: 'spanish', name: 'Spanish', nameRu: 'Испанский', isPopular: true },
          { code: 'french', name: 'French', nameRu: 'Французский', isPopular: true },
          { code: 'german', name: 'German', nameRu: 'Немецкий', isPopular: false },
          { code: 'chinese', name: 'Chinese', nameRu: 'Китайский', isPopular: false },
          { code: 'arabic', name: 'Arabic', nameRu: 'Арабский', isPopular: false },
          { code: 'japanese', name: 'Japanese', nameRu: 'Японский', isPopular: false },
          { code: 'korean', name: 'Korean', nameRu: 'Корейский', isPopular: false }
        ];
      }
    };

    const fetchStats = async () => {
      try {
        const response = await getVocabularyStats();
        stats.value = response.data || { totalWords: 0, byLanguage: [], topTopics: [] };
      } catch (err) {
        console.error('Error fetching stats:', err);
        stats.value = { totalWords: 0, byLanguage: [], topTopics: [] };
      }
    };

    const fetchUserProgress = async () => {
      if (!currentUser.value) return;
      
      try {
        const response = await getUserVocabularyProgress(currentUser.value.uid);
        userProgress.value = response.data || {
          wordsLearned: 0, accuracy: 0, weeklyGrowth: 0, accuracyTrend: 0, byLanguage: {}
        };
      } catch (err) {
        console.error('Error fetching user progress:', err);
        userProgress.value = {
          wordsLearned: 0, accuracy: 0, weeklyGrowth: 0, accuracyTrend: 0, byLanguage: {}
        };
      }
    };

    const fetchWordsForReview = async () => {
      if (!currentUser.value) return;
      
      try {
        const response = await getWordsForReview(currentUser.value.uid, { limit: 50 });
        wordsForReview.value = response.count || 0;
      } catch (err) {
        console.error('Error fetching words for review:', err);
        wordsForReview.value = 0;
      }
    };

    const fetchRecentWords = async () => {
      try {
        const response = await searchVocabulary({ limit: 10, sort: '-createdAt' });
        recentWords.value = response.data || [];
      } catch (err) {
        console.error('Error fetching recent words:', err);
        recentWords.value = [];
      }
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        error.value = '';
        
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
        
      } catch (err) {
        console.error('Error fetching vocabulary data:', err);
        error.value = 'Не удалось загрузить данные словаря. Попробуйте еще раз.';
      } finally {
        loading.value = false;
      }
    };

    // Watchers
    watch(currentUser, async (newUser, oldUser) => {
      if (newUser && !oldUser) {
        await fetchUserProgress();
        await fetchWordsForReview();
      } else if (!newUser && oldUser) {
        userProgress.value = null;
        wordsForReview.value = 0;
      }
    });

    // Lifecycle
    onMounted(async () => {
      await fetchData();
    });

    return {
      loading,
      error,
      languages,
      stats,
      userProgress,
      recentWords,
      wordsForReview,
      toastMessage,
      toastType,
      showCreateTestModal,
      currentUser,
      getLanguageFlag,
      getLanguageNameRu,
      getLanguageProgress,
      getLanguageWordCount,
      getLanguageTopicCount,
      selectLanguage,
      openCreateTestModal,
      closeCreateTestModal,
      createTest,
      reviewWords,
      viewProgress,
      viewAchievements,
      viewWord,
      fetchData
    };
  }
};
</script>

<style scoped>
/* Variables */
:root {
  --brand-purple: #8b5cf6;
  --brand-purple-dark: #7c3aed;
  --brand-purple-light: #a78bfa;
  --black: #000000;
  --white: #ffffff;
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
  --gradient-primary: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  --gradient-card: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
}

/* Base */
.vocabulary-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: var(--black);
  font-family: 'Inter', system-ui, sans-serif;
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
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 64px;
  position: relative;
  animation: headerSlideIn 1s ease-out;
}

.header-content {
  background: var(--white);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.header-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--gradient-primary);
}

.header-icon {
  font-size: 64px;
  margin-bottom: 24px;
  animation: float 6s ease-in-out infinite;
}

.page-title {
  font-size: 48px;
  font-weight: 900;
  margin: 0 0 16px 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 18px;
  color: var(--gray-600);
  margin: 0 0 40px 0;
  font-weight: 400;
  line-height: 1.6;
}

.stats-grid {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 32px;
}

.stat-item {
  text-align: center;
  background: var(--gradient-card);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
  transition: left 0.6s ease;
}

.stat-item:hover::before {
  left: 100%;
}

.stat-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.25);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 800;
  color: var(--brand-purple);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.header-decoration {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 2px;
}

/* Loading & Error States */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--brand-purple);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 40px;
  height: 40px;
  top: 10px;
  left: 10px;
  animation-delay: -0.4s;
  border-top-color: var(--brand-purple-light);
}

.spinner-ring:nth-child(3) {
  width: 20px;
  height: 20px;
  top: 20px;
  left: 20px;
  animation-delay: -0.8s;
  border-top-color: var(--brand-purple-dark);
}

.loading-state span {
  color: var(--gray-600);
  font-size: 16px;
  font-weight: 500;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.error-state h3 {
  color: var(--brand-purple);
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.error-state p {
  color: var(--gray-600);
  margin-bottom: 32px;
  font-size: 16px;
}

.retry-btn {
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Section Headers */
.section-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.section-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--black);
  margin: 0;
  position: relative;
  display: inline-block;
}

.section-decoration {
  width: 60px;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 2px;
  margin: 16px auto 0;
}

/* Languages Section */
.languages-section {
  margin-bottom: 80px;
  animation: fadeInUp 0.8s ease 0.2s both;
}

.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 32px;
}

.language-card {
  background: var(--white);
  border-radius: 24px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.4s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  will-change: transform;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.language-card:hover .card-glow {
  transform: scaleX(1);
}

.language-card:hover {
  transform: translateY(-12px) scale(1.02);
  border-color: var(--brand-purple);
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.25);
  will-change: auto;
}

.language-card:active {
  transform: translateY(-8px) scale(0.98);
}

.language-card.popular {
  border-color: var(--brand-purple);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.language-flag {
  font-size: 48px;
  animation: bounce 2s ease-in-out infinite;
}

.language-card:hover .language-flag {
  animation-play-state: paused;
  transform: scale(1.1);
}

.popular-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--gradient-primary);
  color: var(--white);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.badge-icon {
  font-size: 14px;
  animation: twinkle 2s ease-in-out infinite;
}

.card-content {
  margin-bottom: 24px;
  text-align: center;
}

.language-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--black);
  margin: 0 0 8px 0;
}

.language-subtitle {
  font-size: 16px;
  color: var(--gray-500);
  margin: 0 0 20px 0;
  font-style: italic;
}

.language-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gray-50);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
  transition: all 0.3s ease;
}

.language-card:hover .meta-item {
  background: var(--gradient-card);
  color: var(--brand-purple);
}

.meta-icon {
  font-size: 16px;
}

.progress-circle {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
}

.circular-chart {
  display: block;
  margin: 10px auto;
  max-width: 80%;
  max-height: 250px;
}

.circle-bg {
  fill: none;
  stroke: var(--gray-200);
  stroke-width: 2.8;
}

.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  animation: progress 1s ease-in-out forwards;
  stroke: var(--brand-purple);
}

.percentage {
  fill: var(--brand-purple);
  font-family: sans-serif;
  font-size: 0.5em;
  font-weight: bold;
  text-anchor: middle;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--gradient-card);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
}

.language-card:hover .card-action {
  background: var(--gradient-primary);
  color: var(--white);
  transform: translateX(4px);
}

.action-text {
  font-weight: 600;
  font-size: 16px;
}

.action-arrow {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.language-card:hover .action-arrow {
  transform: translateX(4px);
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 80px;
  animation: fadeInUp 0.8s ease 0.4s both;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--white);
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  will-change: transform;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
  transition: left 0.6s ease;
}

.action-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: var(--brand-purple);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.25);
  will-change: auto;
}

.action-btn:active {
  transform: translateY(-4px) scale(0.98);
}

.action-btn:active::after {
  width: 300px;
  height: 300px;
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: var(--white);
}

.action-btn.primary:hover {
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.4);
}

.btn-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--gradient-primary);
  color: var(--white);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.btn-icon {
  font-size: 32px;
  transition: transform 0.3s ease;
}

.action-btn:hover .btn-icon {
  transform: scale(1.1) rotate(5deg);
  animation: iconWiggle 0.5s ease-in-out;
}

.btn-content {
  flex: 1;
  text-align: left;
}

.btn-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.btn-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.btn-arrow {
  font-size: 24px;
  transition: transform 0.3s ease;
}

.action-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* Recent Words */
.recent-words {
  margin-bottom: 80px;
  animation: fadeInUp 0.8s ease 0.6s both;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.word-card {
  background: var(--white);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  will-change: transform;
}

.word-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--gradient-primary);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.word-card:hover::before {
  transform: scaleY(1);
}

.word-card:hover {
  transform: translateY(-6px) translateX(8px);
  border-color: var(--brand-purple);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.2);
  will-change: auto;
}

.word-card:active {
  transform: translateY(-3px) scale(0.99);
}

.word-main {
  font-size: 24px;
  font-weight: 700;
  color: var(--black);
  margin-bottom: 8px;
}

.word-translation {
  font-size: 18px;
  color: var(--gray-600);
  margin-bottom: 16px;
  font-style: italic;
}

.word-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tag.language {
  background: var(--gradient-card);
  color: var(--brand-purple);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.tag.topic {
  background: var(--gray-100);
  color: var(--gray-700);
}

.word-hover {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.word-card:hover .word-hover {
  opacity: 1;
}

.hover-icon {
  font-size: 20px;
  color: var(--brand-purple);
}

.word-card:hover .hover-icon {
  animation: eyeBlink 2s ease-in-out infinite;
}

/* Toast */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: var(--white);
  color: var(--black);
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: toastSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--brand-purple);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
}

.toast.error {
  border-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

.toast.success {
  border-color: #10b981;
  background: #ecfdf5;
  color: #065f46;
}

.toast-icon {
  font-size: 18px;
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

@keyframes progress {
  0% { stroke-dasharray: 0 100; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes headerSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideIn {
  from {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes iconWiggle {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-5deg) scale(1.1); }
  75% { transform: rotate(5deg) scale(1.1); }
}

@keyframes eyeBlink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.3; }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .vocabulary-page {
    padding: 24px 20px;
  }

  .languages-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .vocabulary-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 36px;
  }

  .page-subtitle {
    font-size: 16px;
  }

  .header-content {
    padding: 32px 24px;
  }

  .stats-grid {
    flex-direction: column;
    gap: 16px;
    max-width: 300px;
    margin: 0 auto;
  }

  .languages-grid {
    grid-template-columns: 1fr;
  }

  .language-card {
    padding: 24px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .words-grid {
    grid-template-columns: 1fr;
  }

  .progress-circle {
    top: 16px;
    right: 16px;
    width: 50px;
    height: 50px;
  }

  .language-meta {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 28px;
  }

  .header-icon {
    font-size: 48px;
  }

  .language-flag {
    font-size: 36px;
  }

  .action-btn {
    padding: 20px;
    gap: 16px;
  }

  .btn-icon {
    font-size: 28px;
  }

  .btn-title {
    font-size: 16px;
  }

  .btn-subtitle {
    font-size: 13px;
  }

  .toast {
    left: 16px;
    right: 16px;
    top: 16px;
    max-width: none;
  }
}

@media (max-width: 320px) {
  .vocabulary-page {
    padding: 16px 12px;
  }
  
  .header-content {
    padding: 24px 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .stats-grid {
    gap: 12px;
  }
  
  .stat-item {
    padding: 16px 12px;
  }
  
  .language-card {
    padding: 20px 16px;
  }
  
  .action-btn {
    padding: 16px;
    gap: 12px;
  }
  
  .word-card {
    padding: 20px 16px;
  }
}

/* Accessibility */
.language-card:focus,
.action-btn:focus,
.word-card:focus,
.retry-btn:focus {
  outline: 3px solid var(--brand-purple);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .language-card,
  .action-btn,
  .word-card,
  .stat-item {
    border: 3px solid var(--black);
  }
  
  .language-card:hover,
  .action-btn:hover,
  .word-card:hover {
    border-color: var(--brand-purple);
    box-shadow: 0 0 0 3px var(--brand-purple);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --white: #1a1a1a;
    --black: #ffffff;
    --gray-50: #2a2a2a;
    --gray-100: #3a3a3a;
    --gray-200: #4a4a4a;
    --gray-300: #6a6a6a;
    --gray-400: #8a8a8a;
    --gray-500: #aaaaaa;
    --gray-600: #cccccc;
    --gray-700: #eeeeee;
  }
  
  .vocabulary-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  }
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

/* Performance optimizations */
.language-card,
.action-btn,
.word-card {
  will-change: transform;
}

.language-card:hover,
.action-btn:hover,
.word-card:hover {
  will-change: auto;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
}

::-webkit-scrollbar-thumb {
  background: var(--brand-purple);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--brand-purple-dark);
}

/* Print styles */
@media print {
  .vocabulary-page {
    background: white !important;
  }
  
  .vocabulary-page::before {
    display: none;
  }
  
  .header-content,
  .language-card,
  .action-btn,
  .word-card {
    box-shadow: none !important;
    border: 1px solid var(--gray-300) !important;
  }
  
  .action-btn,
  .retry-btn {
    display: none;
  }
}
</style>