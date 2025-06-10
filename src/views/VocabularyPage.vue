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
        <section class="languages-section">
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
  
        <!-- Quick Actions -->
        <section class="quick-actions">
          <h2 class="section-title">Быстрые действия</h2>
          <div class="action-cards">
            <div class="action-card" @click="openCreateTestModal">
              <div class="action-icon">🎯</div>
              <h4>Создать тест</h4>
              <p>Создайте персональный тест для практики</p>
            </div>
            
            <div class="action-card" @click="reviewWords" v-if="wordsForReview > 0">
              <div class="action-count">{{ wordsForReview }}</div>
              <div class="action-icon">📚</div>
              <h4>Повторить</h4>
              <p>Практика недавно изученных слов</p>
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
  
        <!-- Recent Activity -->
        <section class="recent-activity" v-if="recentWords.length > 0">
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
  
      <!-- Create Test Modal -->
      <CreateTestModal 
        v-if="showCreateTestModal"
        :languages="languages"
        @close="closeCreateTestModal"
        @create="createTest"
      />
  
      <!-- Toast Messages -->
      <div v-if="toastMessage" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useStore } from 'vuex';
  import { useRouter } from 'vue-router';
  import CreateTestModal from '../components/Modals/CreateTestModal';
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
        const count = langStat ? langStat.count : 8;
        return `${count} ${getWordPlural(count)}`;
      };
  
      const getLanguageTopicCount = (languageCode) => {
        const count = 3;
        return `${count} ${getTopicPlural(count)}`;
      };
  
      const getWordPlural = (count) => {
        if (count % 10 === 1 && count % 100 !== 11) return 'слово';
        if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'слова';
        return 'слов';
      };
  
      const getTopicPlural = (count) => {
        if (count % 10 === 1 && count % 100 !== 11) return 'тема';
        if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'темы';
        return 'тем';
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
          const languageData = response.data || [];
          
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
        getLanguageColor,
        getLanguageProgress,
        getLanguageWordCount,
        getLanguageTopicCount,
        getProgressTrend,
        getAccuracyTrend,
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

/* Base styles */
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
  color: var(--text-primary);
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
.error-container {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-primary);
}

.loading-container p,
.error-container p {
  color: var(--text-secondary);
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

.error-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.error-container h3 {
  color: var(--danger-color);
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.retry-btn {
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

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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

  .action-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .recent-words {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .title-text {
    font-size: 2rem;
  }

  .action-cards {
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
}

/* Focus styles for accessibility */
.language-card:focus,
.action-card:focus,
.recent-word-card:focus {
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
  .recent-word-card {
    border: 3px solid var(--text-primary);
  }
}

/* Print styles */
@media print {
  .vocabulary-page {
    max-width: none;
    padding: 0;
  }

  .language-card,
  .stat-card,
  .action-card,
  .recent-word-card {
    box-shadow: none;
    border: 1px solid var(--border-color);
    break-inside: avoid;
  }
}
</style>