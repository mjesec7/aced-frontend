<template>
  <div class="vocabulary-page">
    <!-- Header Section -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">Vocabulary Learning</h1>
        <p class="page-subtitle">Master languages through intelligent vocabulary building</p>
        
        <!-- Compact Stats -->
        <div class="stats-grid" v-if="stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.totalWords || 0 }}</span>
            <span class="stat-label">Words</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ userProgress?.wordsLearned || 0 }}</span>
            <span class="stat-label">Learned</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ userProgress?.accuracy || 0 }}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading vocabulary data...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠</div>
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-btn">Retry</button>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Languages Grid -->
      <section class="languages-section">
        <h2 class="section-title">Available Languages</h2>
        <div class="languages-grid">
          <div 
            v-for="language in languages" 
            :key="language.code"
            class="language-card"
            :class="{ popular: language.isPopular }"
            @click="selectLanguage(language)"
          >
            <div class="card-header">
              <span class="language-flag">{{ getLanguageFlag(language.code) }}</span>
              <div v-if="language.isPopular" class="popular-badge">Popular</div>
            </div>
            
            <div class="card-content">
              <h3 class="language-name">{{ language.nameRu || language.name }}</h3>
              <p class="language-subtitle">{{ language.name }}</p>
              
              <div class="language-meta">
                <span class="meta-item">{{ getLanguageWordCount(language.code) }}</span>
                <span class="meta-item">{{ getLanguageTopicCount(language.code) }}</span>
              </div>
            </div>
            
            <!-- Progress Indicator -->
            <div class="progress-indicator">
              <div 
                class="progress-fill" 
                :style="{ width: getLanguageProgress(language.code) + '%' }"
              ></div>
            </div>
            
            <div class="card-action">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-btn primary" @click="openCreateTestModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Create Test
          </button>
          
          <button class="action-btn" @click="reviewWords" v-if="wordsForReview > 0">
            <span class="action-count">{{ wordsForReview }}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2 3h6l4 6 4-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Review Words
          </button>
          
          <button class="action-btn" @click="viewProgress">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3v18h18" stroke="currentColor" stroke-width="2"/>
              <path d="m19 9-5 5-4-4-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Progress
          </button>
          
          <button class="action-btn" @click="viewAchievements">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="currentColor" stroke-width="2"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="currentColor" stroke-width="2"/>
              <path d="M4 22h16l-1-7H5l-1 7Z" stroke="currentColor" stroke-width="2"/>
              <path d="M6 9h12" stroke="currentColor" stroke-width="2"/>
            </svg>
            Achievements
          </button>
        </div>
      </section>

      <!-- Recent Words -->
      <section class="recent-words" v-if="recentWords.length > 0">
        <h2 class="section-title">Recently Added</h2>
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
              <span class="tag">{{ getLanguageNameRu(word.language) }}</span>
              <span class="tag">{{ word.topic }}</span>
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
      if (!stats.value || !stats.value.byLanguage) return '8 words';
      const langStat = stats.value.byLanguage.find(l => l._id === languageCode);
      const count = langStat ? langStat.count : 8;
      return `${count} words`;
    };

    const getLanguageTopicCount = (languageCode) => {
      return '3 topics';
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
        showToast('Please sign in to create a test', 'error');
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

    const reviewWords = () => showToast('Review function coming soon!');
    const viewProgress = () => showToast('Progress view coming soon!');
    const viewAchievements = () => showToast('Achievements coming soon!');
    const viewWord = (word) => showToast(`View: ${word.word} - ${word.translation}`);

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
            { code: 'english', name: 'English', nameRu: 'English' },
            { code: 'spanish', name: 'Spanish', nameRu: 'Spanish' },
            { code: 'french', name: 'French', nameRu: 'French' },
            { code: 'german', name: 'German', nameRu: 'German' },
            { code: 'chinese', name: 'Chinese', nameRu: 'Chinese' },
            { code: 'arabic', name: 'Arabic', nameRu: 'Arabic' },
            { code: 'japanese', name: 'Japanese', nameRu: 'Japanese' },
            { code: 'korean', name: 'Korean', nameRu: 'Korean' }
          ];
        }
        
        languages.value = languageData.map(lang => ({
          ...lang,
          isPopular: ['english', 'spanish', 'french'].includes(lang.code)
        }));
        
      } catch (err) {
        console.error('Error fetching languages:', err);
        languages.value = [
          { code: 'english', name: 'English', nameRu: 'English', isPopular: true },
          { code: 'spanish', name: 'Spanish', nameRu: 'Spanish', isPopular: true },
          { code: 'french', name: 'French', nameRu: 'French', isPopular: true },
          { code: 'german', name: 'German', nameRu: 'German', isPopular: false },
          { code: 'chinese', name: 'Chinese', nameRu: 'Chinese', isPopular: false },
          { code: 'arabic', name: 'Arabic', nameRu: 'Arabic', isPopular: false },
          { code: 'japanese', name: 'Japanese', nameRu: 'Japanese', isPopular: false },
          { code: 'korean', name: 'Korean', nameRu: 'Korean', isPopular: false }
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
        error.value = 'Failed to load vocabulary data. Please try again.';
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
}

/* Base */
.vocabulary-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: var(--white);
  color: var(--black);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  line-height: 1.5;
}

/* Header */
.page-header {
  margin-bottom: 48px;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 32px;
}

.header-content {
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--black);
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 16px;
  color: var(--gray-600);
  margin: 0 0 32px 0;
  font-weight: 400;
}

.stats-grid {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-purple);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-top: 4px;
}

/* Loading & Error States */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--brand-purple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state span {
  color: var(--gray-600);
  font-size: 14px;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 16px;
  color: var(--gray-400);
}

.error-state p {
  color: var(--gray-600);
  margin-bottom: 24px;
}

.retry-btn {
  background: var(--brand-purple);
  color: var(--white);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: var(--brand-purple-dark);
}

/* Section Titles */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 24px 0;
  letter-spacing: -0.025em;
}

/* Languages Section */
.languages-section {
  margin-bottom: 64px;
}

.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.language-card {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--white);
  position: relative;
}

.language-card:hover {
  border-color: var(--brand-purple);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.language-card.popular {
  border-color: var(--brand-purple);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.language-flag {
  font-size: 24px;
}

.popular-badge {
  background: var(--brand-purple);
  color: var(--white);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-content {
  margin-bottom: 16px;
}

.language-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 4px 0;
}

.language-subtitle {
  font-size: 14px;
  color: var(--gray-500);
  margin: 0 0 12px 0;
}

.language-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  font-size: 12px;
  color: var(--gray-600);
}

.progress-indicator {
  height: 2px;
  background: var(--gray-200);
  border-radius: 1px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--brand-purple);
  border-radius: 1px;
  transition: width 0.3s ease;
}

.card-action {
  display: flex;
  justify-content: flex-end;
  color: var(--gray-400);
  transition: color 0.2s ease;
}

.language-card:hover .card-action {
  color: var(--brand-purple);
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 64px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  background: var(--white);
  color: var(--gray-700);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.action-btn:hover {
  border-color: var(--gray-300);
  background: var(--gray-50);
}

.action-btn.primary {
  background: var(--brand-purple);
  color: var(--white);
  border-color: var(--brand-purple);
}

.action-btn.primary:hover {
  background: var(--brand-purple-dark);
  border-color: var(--brand-purple-dark);
}

.action-count {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--brand-purple);
  color: var(--white);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Recent Words */
.recent-words {
  margin-bottom: 64px;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.word-card {
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--white);
}

.word-card:hover {
  border-color: var(--brand-purple);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.word-main {
  font-size: 16px;
  font-weight: 600;
  color: var(--black);
  margin-bottom: 4px;
}

.word-translation {
  font-size: 14px;
  color: var(--gray-600);
  margin-bottom: 12px;
}

.word-tags {
  display: flex;
  gap: 8px;
}

.tag {
  background: var(--gray-100);
  color: var(--gray-700);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 6px;
  border-radius: 4px;
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--brand-purple);
  color: var(--white);
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.error {
  background: #ef4444;
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

/* Responsive */
@media (max-width: 768px) {
  .vocabulary-page {
    padding: 16px;
  }
  
  .stats-grid {
    gap: 24px;
  }
  
  .languages-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .words-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    flex-direction: column;
    gap: 16px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>