<template>
    <div class="vocabulary-page">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">📚 Словарь</h1>
        <p class="page-subtitle">Изучайте новые слова и расширяйте свой словарный запас</p>
        
        <!-- Quick Stats -->
        <div class="quick-stats" v-if="userProgress">
          <div class="stat-card">
            <div class="stat-number">{{ userProgress.totalWords || 0 }}</div>
            <div class="stat-label">Изученных слов</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ userProgress.streakDays || 0 }}</div>
            <div class="stat-label">Дней подряд</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ userProgress.reviewCount || 0 }}</div>
            <div class="stat-label">На повторение</div>
          </div>
        </div>
      </div>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Загружаем языки...</p>
      </div>
  
      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">😔</div>
        <h3>Произошла ошибка</h3>
        <p>{{ error }}</p>
        <button @click="fetchLanguages" class="retry-btn">Попробовать снова</button>
      </div>
  
      <!-- Language Cards -->
      <div v-else class="languages-grid">
        <div
          v-for="language in languages"
          :key="language.code"
          class="language-card"
          :class="{ popular: isPopular(language.code) }"
          @click="selectLanguage(language)"
        >
          <div class="language-flag">
            {{ getLanguageFlag(language.code) }}
          </div>
          
          <div class="language-info">
            <h3 class="language-name">{{ language.name }}</h3>
            <p class="language-name-ru">{{ language.nameRu }}</p>
            <div class="language-stats" v-if="languageStats[language.code]">
              <span class="word-count">
                {{ languageStats[language.code].wordCount || 0 }} слов
              </span>
              <span class="topic-count">
                {{ languageStats[language.code].topicCount || 0 }} тем
              </span>
            </div>
          </div>
  
          <div class="language-badge" v-if="isPopular(language.code)">
            ⭐ Популярный
          </div>
  
          <div class="progress-ring" v-if="userProgress && userProgress[language.code]">
            <svg class="progress-circle" width="50" height="50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="4"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="#3b82f6"
                stroke-width="4"
                :stroke-dasharray="`${userProgress[language.code]} 125`"
                stroke-linecap="round"
                transform="rotate(-90 25 25)"
              />
            </svg>
            <span class="progress-text">
              {{ Math.round(userProgress[language.code]) }}%
            </span>
          </div>
          
          <div class="card-arrow">→</div>
        </div>
      </div>
  
      <!-- Quick Actions -->
      <div class="quick-actions" v-if="!loading && !error">
        <h3>🎯 Быстрые действия</h3>
        <div class="action-cards">
          <div class="action-card" @click="startQuickReview">
            <div class="action-icon">🔄</div>
            <h4>Повторение</h4>
            <p>Повторить изученные слова</p>
            <span class="action-count" v-if="reviewCount > 0">{{ reviewCount }} слов</span>
          </div>
          
          <div class="action-card" @click="openRandomQuiz">
            <div class="action-icon">🎲</div>
            <h4>Случайный тест</h4>
            <p>Проверить знания</p>
          </div>
          
          <div class="action-card" @click="viewProgress">
            <div class="action-icon">📊</div>
            <h4>Мой прогресс</h4>
            <p>Статистика изучения</p>
          </div>
          
          <div class="action-card" @click="findNewWords">
            <div class="action-icon">🔍</div>
            <h4>Поиск слов</h4>
            <p>Найти новые слова</p>
          </div>
        </div>
      </div>
  
      <!-- Recent Activity -->
      <div class="recent-activity" v-if="recentWords.length > 0">
        <h3>📖 Недавно изученные</h3>
        <div class="recent-words">
          <div
            v-for="word in recentWords"
            :key="word._id"
            class="recent-word-card"
            @click="reviewWord(word)"
          >
            <div class="word-main">{{ word.word }}</div>
            <div class="word-translation">{{ word.translation }}</div>
            <div class="word-meta">
              <span class="word-language">{{ getLanguageName(word.language) }}</span>
              <span class="word-topic">{{ word.topic }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Floating Action Button for Quick Add -->
      <button class="fab" @click="showAddWordModal = true" title="Добавить слово">
        ➕
      </button>
  
      <!-- Add Word Modal -->
      <div v-if="showAddWordModal" class="modal-overlay" @click="closeAddWordModal">
        <div class="add-word-modal" @click.stop>
          <div class="modal-header">
            <h3>✍️ Добавить слово</h3>
            <button @click="closeAddWordModal" class="close-btn">✕</button>
          </div>
          
          <form @submit.prevent="addQuickWord" class="add-word-form">
            <div class="form-group">
              <label>Слово</label>
              <input
                v-model="newWord.word"
                type="text"
                placeholder="Введите слово"
                required
              />
            </div>
            
            <div class="form-group">
              <label>Перевод</label>
              <input
                v-model="newWord.translation"
                type="text"
                placeholder="Введите перевод"
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Язык</label>
                <select v-model="newWord.language" required>
                  <option value="">Выберите язык</option>
                  <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                    {{ lang.nameRu }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Тема</label>
                <input
                  v-model="newWord.topic"
                  type="text"
                  placeholder="Например: Путешествия"
                  required
                />
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeAddWordModal" class="btn-secondary">
                Отмена
              </button>
              <button type="submit" class="btn-primary" :disabled="addingWord">
                <span v-if="addingWord">Добавляем...</span>
                <span v-else>Добавить</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  import {
    getVocabularyLanguages,
    getVocabularyStats,
    getUserVocabularyProgress,
    getRecentWords,
    addVocabularyWord
  } from '@/api/vocabulary';
  
  export default {
    name: 'VocabularyPage',
    setup() {
      const router = useRouter();
      const store = useStore();
      
      // Data
      const loading = ref(true);
      const error = ref('');
      const languages = ref([]);
      const languageStats = ref({});
      const userProgress = ref(null);
      const recentWords = ref([]);
      const showAddWordModal = ref(false);
      const addingWord = ref(false);
      
      // New word form
      const newWord = ref({
        word: '',
        translation: '',
        language: '',
        topic: 'Общие',
        subtopic: 'Базовые слова',
        partOfSpeech: 'noun',
        difficulty: 'beginner'
      });
      
      // Computed
      const reviewCount = computed(() => {
        return userProgress.value?.reviewCount || 0;
      });
      
      const currentUser = computed(() => store.getters.user);
      
      // Methods
      const getLanguageFlag = (languageCode) => {
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
        return flags[languageCode] || '🌐';
      };
      
      const getLanguageName = (languageCode) => {
        const language = languages.value.find(l => l.code === languageCode);
        return language ? language.nameRu : languageCode;
      };
      
      const isPopular = (languageCode) => {
        const popularLanguages = ['english', 'spanish', 'french', 'german'];
        return popularLanguages.includes(languageCode);
      };
      
      const selectLanguage = (language) => {
        router.push({
          name: 'VocabularyTopics',
          params: { language: language.code }
        });
      };
      
      const startQuickReview = () => {
        router.push({ name: 'VocabularyReview' });
      };
      
      const openRandomQuiz = () => {
        router.push({ name: 'VocabularyQuiz' });
      };
      
      const viewProgress = () => {
        router.push({ name: 'VocabularyProgress' });
      };
      
      const findNewWords = () => {
        router.push({ name: 'VocabularySearch' });
      };
      
      const reviewWord = (word) => {
        // Open word detail modal or navigate to word page
        router.push({
          name: 'VocabularyWord',
          params: { id: word._id }
        });
      };
      
      const closeAddWordModal = () => {
        showAddWordModal.value = false;
        newWord.value = {
          word: '',
          translation: '',
          language: '',
          topic: 'Общие',
          subtopic: 'Базовые слова',
          partOfSpeech: 'noun',
          difficulty: 'beginner'
        };
      };
      
      const addQuickWord = async () => {
        if (!currentUser.value) {
          error.value = 'Необходимо войти в систему';
          return;
        }
        
        try {
          addingWord.value = true;
          
          await addVocabularyWord({
            ...newWord.value,
            subject: getLanguageName(newWord.value.language)
          });
          
          closeAddWordModal();
          
          // Refresh data
          await fetchRecentWords();
          
          // Show success message
          store.dispatch('showToast', {
            type: 'success',
            message: 'Слово успешно добавлено!'
          });
          
        } catch (err) {
          console.error('Error adding word:', err);
          error.value = 'Ошибка при добавлении слова';
        } finally {
          addingWord.value = false;
        }
      };
      
      // API calls
      const fetchLanguages = async () => {
        try {
          loading.value = true;
          error.value = '';
          
          const response = await getVocabularyLanguages();
          languages.value = response.data || [];
          
        } catch (err) {
          console.error('Error fetching languages:', err);
          error.value = 'Не удалось загрузить языки';
        } finally {
          loading.value = false;
        }
      };
      
      const fetchLanguageStats = async () => {
        try {
          const response = await getVocabularyStats();
          languageStats.value = response.data?.byLanguage || {};
        } catch (err) {
          console.error('Error fetching language stats:', err);
        }
      };
      
      const fetchUserProgress = async () => {
        if (!currentUser.value) return;
        
        try {
          const response = await getUserVocabularyProgress(currentUser.value.uid);
          userProgress.value = response.data || null;
        } catch (err) {
          console.error('Error fetching user progress:', err);
        }
      };
      
      const fetchRecentWords = async () => {
        if (!currentUser.value) return;
        
        try {
          const response = await getRecentWords(currentUser.value.uid, { limit: 6 });
          recentWords.value = response.data || [];
        } catch (err) {
          console.error('Error fetching recent words:', err);
        }
      };
      
      // Lifecycle
      onMounted(async () => {
        await fetchLanguages();
        await fetchLanguageStats();
        await fetchUserProgress();
        await fetchRecentWords();
      });
      
      return {
        loading,
        error,
        languages,
        languageStats,
        userProgress,
        recentWords,
        reviewCount,
        showAddWordModal,
        newWord,
        addingWord,
        
        // Methods
        getLanguageFlag,
        getLanguageName,
        isPopular,
        selectLanguage,
        startQuickReview,
        openRandomQuiz,
        viewProgress,
        findNewWords,
        reviewWord,
        closeAddWordModal,
        addQuickWord,
        fetchLanguages
      };
    }
  };
  </script>
  
  <style scoped>
  .vocabulary-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  /* Header */
  .page-header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .page-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1f2937;
    margin: 0 0 10px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .page-subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    margin: 0 0 30px 0;
  }
  
  /* Quick Stats */
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    border: 1px solid #e5e7eb;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 5px;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  /* Loading & Error States */
  .loading-container,
  .error-container {
    text-align: center;
    padding: 60px 20px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .error-container h3 {
    color: #dc2626;
    margin-bottom: 10px;
  }
  
  .retry-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 20px;
    transition: background 0.2s;
  }
  
  .retry-btn:hover {
    background: #2563eb;
  }
  
  /* Language Cards Grid */
  .languages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 50px;
  }
  
  .language-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .language-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    border-color: #3b82f6;
  }
  
  .language-card.popular {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }
  
  .language-card.popular:hover {
    border-color: #d97706;
  }
  
  .language-flag {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 16px;
  }
  
  .language-info {
    text-align: center;
    margin-bottom: 16px;
  }
  
  .language-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }
  
  .language-name-ru {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 12px 0;
  }
  
  .language-stats {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 0.875rem;
  }
  
  .word-count,
  .topic-count {
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 6px;
    color: #374151;
    font-weight: 500;
  }
  
  .language-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #f59e0b;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .progress-ring {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 50px;
    height: 50px;
  }
  
  .progress-circle {
    transform: rotate(-90deg);
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: #3b82f6;
  }
  
  .card-arrow {
    position: absolute;
    bottom: 16px;
    right: 16px;
    font-size: 1.5rem;
    color: #9ca3af;
    transition: transform 0.3s ease;
  }
  
  .language-card:hover .card-arrow {
    transform: translateX(4px);
    color: #3b82f6;
  }
  
  /* Quick Actions */
  .quick-actions {
    margin-bottom: 50px;
  }
  
  .quick-actions h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 24px;
    text-align: center;
  }
  
  .action-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .action-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    border-color: #3b82f6;
  }
  
  .action-icon {
    font-size: 2.5rem;
    margin-bottom: 16px;
  }
  
  .action-card h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }
  
  .action-card p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
  
  .action-count {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #ef4444;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  /* Recent Activity */
  .recent-activity {
    margin-bottom: 50px;
  }
  
  .recent-activity h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 24px;
    text-align: center;
  }
  
  .recent-words {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .recent-word-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .recent-word-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    border-color: #3b82f6;
  }
  
  .word-main {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
  }
  
  .word-translation {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 12px;
  }
  
  .word-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  .word-language,
  .word-topic {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  /* Floating Action Button */
  .fab {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .fab:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  
  .add-word-modal {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
    margin-bottom: 24px;
  }
  
  .modal-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
  }
  
  .close-btn:hover {
    color: #6b7280;
  }
  
  .add-word-form {
    padding: 0 24px 24px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .form-group label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    font-size: 0.875rem;
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }
  
  .btn-secondary,
  .btn-primary {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .btn-primary:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .vocabulary-page {
      padding: 16px;
    }
    
    .page-title {
      font-size: 2rem;
    }
    
    .quick-stats {
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .languages-grid {
      grid-template-columns: 1fr;
    }
    
    .action-cards {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .recent-words {
      grid-template-columns: 1fr;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .fab {
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      font-size: 1.25rem;
    }
  }
  
  @media (max-width: 480px) {
    .action-cards {
      grid-template-columns: 1fr;
    }
    
    .quick-stats {
      grid-template-columns: 1fr;
    }
  }
</style>