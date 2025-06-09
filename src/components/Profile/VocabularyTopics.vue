<template>
    <div class="vocabulary-topics">
      <!-- Header with Back Button -->
      <div class="page-header">
        <button @click="goBack" class="back-btn">
          ← Back to Languages
        </button>
        
        <div class="language-header">
          <div class="language-flag">{{ getLanguageFlag(language) }}</div>
          <div class="language-info">
            <h1 class="language-title">{{ getLanguageName(language) }}</h1>
            <p class="language-subtitle">Choose a topic to study</p>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="language-stats" v-if="languageStats">
          <div class="stat-item">
            <div class="stat-number">{{ languageStats.totalWords || 0 }}</div>
            <div class="stat-label">words</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ topics.length }}</div>
            <div class="stat-label">topics</div>
          </div>
          <div class="stat-item" v-if="userProgress">
            <div class="stat-number">{{ userProgress.mastered || 0 }}</div>
            <div class="stat-label">mastered</div>
          </div>
        </div>
      </div>
  
      <!-- Search and Filter -->
      <div class="controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Search topics..."
            class="search-input"
          />
        </div>
        
        <div class="filter-buttons">
          <button
            v-for="difficulty in difficultyLevels"
            :key="difficulty.value"
            @click="selectedDifficulty = selectedDifficulty === difficulty.value ? '' : difficulty.value"
            class="filter-btn"
            :class="{ active: selectedDifficulty === difficulty.value }"
          >
            {{ difficulty.icon }} {{ difficulty.label }}
          </button>
        </div>
      </div>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading topics...</p>
      </div>
  
      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">😔</div>
        <h3>Something went wrong</h3>
        <p>{{ error }}</p>
        <button @click="fetchTopics" class="retry-btn">Try Again</button>
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
            <h3 class="topic-name">{{ topic.name }}</h3>
            <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
            
            <div class="topic-stats">
              <div class="stat-badge">
                <span class="stat-icon">📝</span>
                <span>{{ topic.wordCount }} words</span>
              </div>
              <div class="stat-badge">
                <span class="stat-icon">📚</span>
                <span>{{ topic.subtopicCount }} sections</span>
              </div>
              <div class="stat-badge difficulty" :class="topic.difficulty">
                <span class="stat-icon">{{ getDifficultyIcon(topic.difficulty) }}</span>
                <span>{{ getDifficultyLabel(topic.difficulty) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-container" v-if="getTopicProgress(topic)">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getTopicProgress(topic) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(getTopicProgress(topic)) }}%</span>
          </div>
          
          <!-- Status Badge -->
          <div class="status-badge" v-if="isTopicCompleted(topic)">
            ✅ Completed
          </div>
          <div class="status-badge in-progress" v-else-if="isTopicInProgress(topic)">
            📖 In Progress
          </div>
          <div class="status-badge new" v-else>
            🆕 New
          </div>
          
          <div class="card-arrow">→</div>
        </div>
      </div>
  
      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No topics found</h3>
        <p v-if="searchQuery">
          Try changing your search query or reset filters
        </p>
        <p v-else>
          No topics available for {{ getLanguageName(language) }} yet
        </p>
        <button v-if="searchQuery || selectedDifficulty" @click="clearFilters" class="clear-filters-btn">
          Clear Filters
        </button>
      </div>
  
      <!-- Quick Actions -->
      <div class="quick-actions" v-if="!loading && topics.length > 0">
        <h3>🎯 Quick Actions</h3>
        <div class="action-cards">
          <div class="action-card" @click="startRandomQuiz">
            <div class="action-icon">🎲</div>
            <h4>Random Quiz</h4>
            <p>From all {{ getLanguageName(language) }} topics</p>
          </div>
          
          <div class="action-card" @click="continueLastTopic" v-if="lastTopic">
            <div class="action-icon">📖</div>
            <h4>Continue</h4>
            <p>{{ lastTopic.name }}</p>
          </div>
          
          <div class="action-card" @click="reviewWords">
            <div class="action-icon">🔄</div>
            <h4>Review</h4>
            <p>Words for review</p>
            <span class="action-count" v-if="reviewCount > 0">{{ reviewCount }}</span>
          </div>
        </div>
      </div>
  
      <!-- Toast Messages -->
      <div v-if="toastMessage" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useStore } from 'vuex';
  import {
    getVocabularyTopics,
    getLanguageStats,
    getUserLanguageProgress
  } from '@/api/vocabulary';
  
  export default {
    name: 'VocabularyTopics',
    props: {
      language: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const router = useRouter();
      const route = useRoute();
      const store = useStore();
      
      // Data
      const loading = ref(true);
      const error = ref('');
      const topics = ref([]);
      const languageStats = ref(null);
      const userProgress = ref(null);
      const searchQuery = ref('');
      const selectedDifficulty = ref('');
      const toastMessage = ref('');
      const toastType = ref('success');
      
      // Constants
      const difficultyLevels = [
        { value: 'beginner', label: 'Beginner', icon: '🟢' },
        { value: 'intermediate', label: 'Intermediate', icon: '🟡' },
        { value: 'advanced', label: 'Advanced', icon: '🔴' }
      ];
      
      // Computed
      const filteredTopics = computed(() => {
        let filtered = topics.value;
        
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          filtered = filtered.filter(topic =>
            topic.name.toLowerCase().includes(query) ||
            getTopicDescription(topic.name).toLowerCase().includes(query)
          );
        }
        
        if (selectedDifficulty.value) {
          filtered = filtered.filter(topic => topic.difficulty === selectedDifficulty.value);
        }
        
        return filtered;
      });
      
      const currentUser = computed(() => store.getters.user);
      
      const lastTopic = computed(() => {
        if (!userProgress.value || !userProgress.value.lastTopic) return null;
        return topics.value.find(t => t.name === userProgress.value.lastTopic);
      });
      
      const reviewCount = computed(() => {
        return userProgress.value?.reviewCount || 0;
      });
      
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
        const names = {
          english: 'English',
          spanish: 'Spanish',
          french: 'French',
          german: 'German',
          chinese: 'Chinese',
          arabic: 'Arabic',
          japanese: 'Japanese',
          korean: 'Korean',
          uzbek: 'Uzbek',
          russian: 'Russian'
        };
        return names[languageCode] || languageCode;
      };
      
      const getTopicIcon = (topicName) => {
        const icons = {
          'Travel': '✈️',
          'Business': '💼',
          'Food': '🍽️',
          'Family': '👨‍👩‍👧‍👦',
          'Education': '🎓',
          'Health': '🏥',
          'Technology': '💻',
          'Sports': '⚽',
          'Music': '🎵',
          'Art': '🎨',
          'Nature': '🌿',
          'Animals': '🐾',
          'Transportation': '🚗',
          'Shopping': '🛍️',
          'Weather': '🌤️',
          'Time': '⏰',
          'Colors': '🌈',
          'Numbers': '🔢',
          'Daily Life': '🏠',
          'Путешествия': '✈️',
          'Бизнес': '💼',
          'Еда': '🍽️',
          'Семья': '👨‍👩‍👧‍👦',
          'Образование': '🎓',
          'Здоровье': '🏥',
          'Технологии': '💻',
          'Спорт': '⚽',
          'Музыка': '🎵',
          'Искусство': '🎨'
        };
        return icons[topicName] || '📖';
      };
      
      const getTopicDescription = (topicName) => {
        const descriptions = {
          'Travel': 'Words for travel and tourism',
          'Business': 'Business vocabulary and terms',
          'Food': 'Food, drinks and cooking',
          'Family': 'Family, relatives and relationships',
          'Education': 'Education, school, university',
          'Health': 'Health, medicine, body parts',
          'Technology': 'Technology, computers, internet',
          'Sports': 'Sports, games, physical activity',
          'Music': 'Music, instruments, genres',
          'Art': 'Art, creativity, culture',
          'Nature': 'Nature, environment',
          'Animals': 'Animals, pets',
          'Transportation': 'Transport, travel, roads',
          'Shopping': 'Shopping, stores, commerce',
          'Weather': 'Weather, seasons, climate',
          'Time': 'Time, dates, calendar',
          'Colors': 'Colors, shades, descriptions',
          'Numbers': 'Numbers, math, quantities',
          'Daily Life': 'Daily life, household'
        };
        return descriptions[topicName] || 'Learn new words and expressions';
      };
      
      const getDifficultyIcon = (difficulty) => {
        const icons = {
          beginner: '🟢',
          intermediate: '🟡',
          advanced: '🔴'
        };
        return icons[difficulty] || '⚪';
      };
      
      const getDifficultyLabel = (difficulty) => {
        const labels = {
          beginner: 'Easy',
          intermediate: 'Medium',
          advanced: 'Hard'
        };
        return labels[difficulty] || difficulty;
      };
      
      const getTopicProgress = (topic) => {
        if (!userProgress.value || !userProgress.value.topics) return 0;
        const topicProgress = userProgress.value.topics[topic.name];
        return topicProgress ? topicProgress.percentage : 0;
      };
      
      const isTopicCompleted = (topic) => {
        return getTopicProgress(topic) >= 90;
      };
      
      const isTopicInProgress = (topic) => {
        const progress = getTopicProgress(topic);
        return progress > 0 && progress < 90;
      };
      
      const showToast = (message, type = 'success') => {
        toastMessage.value = message;
        toastType.value = type;
        setTimeout(() => {
          toastMessage.value = '';
        }, 3000);
      };
      
      const selectTopic = (topic) => {
        console.log('📖 Selecting topic:', topic.name, 'for language:', props.language);
        
        // For now, show a message since subtopics view isn't implemented yet
        showToast(`Selected: ${topic.name} (${topic.wordCount} words)`);
        
        // TODO: Navigate to subtopics when implemented
        // router.push({
        //   name: 'VocabularySubtopics',
        //   params: {
        //     language: props.language,
        //     topic: topic.name
        //   }
        // });
      };
      
      const goBack = () => {
        router.push({ name: 'VocabularyPage' });
      };
      
      const clearFilters = () => {
        searchQuery.value = '';
        selectedDifficulty.value = '';
      };
      
      const startRandomQuiz = () => {
        showToast('Random quiz feature coming soon!');
      };
      
      const continueLastTopic = () => {
        if (lastTopic.value) {
          selectTopic(lastTopic.value);
        }
      };
      
      const reviewWords = () => {
        showToast('Review feature coming soon!');
      };
      
      // API calls
      const fetchTopics = async () => {
        try {
          loading.value = true;
          error.value = '';
          
          console.log('📚 Fetching topics for language:', props.language);
          
          const response = await getVocabularyTopics(props.language);
          topics.value = response.data || [];
          
          console.log('✅ Topics fetched:', topics.value.length, 'topics');
          
        } catch (err) {
          console.error('❌ Error fetching topics:', err);
          error.value = 'Failed to load topics';
          topics.value = [];
        } finally {
          loading.value = false;
        }
      };
      
      const fetchLanguageStats = async () => {
        try {
          console.log('📊 Fetching language stats for:', props.language);
          const response = await getLanguageStats(props.language);
          languageStats.value = response.data || null;
          console.log('✅ Language stats fetched:', languageStats.value);
        } catch (err) {
          console.error('❌ Error fetching language stats:', err);
          languageStats.value = null;
        }
      };
      
      const fetchUserProgress = async () => {
        if (!currentUser.value) {
          console.log('⚠️ No user logged in, skipping progress fetch');
          return;
        }
        
        try {
          console.log('📈 Fetching user progress for:', currentUser.value.uid, 'language:', props.language);
          const response = await getUserLanguageProgress(
            currentUser.value.uid,
            props.language
          );
          userProgress.value = response.data || null;
          console.log('✅ User progress fetched:', userProgress.value);
        } catch (err) {
          console.error('❌ Error fetching user progress:', err);
          userProgress.value = null;
        }
      };
      
      const fetchData = async () => {
        console.log('🚀 Starting data fetch for language:', props.language);
        
        await Promise.all([
          fetchTopics(),
          fetchLanguageStats()
        ]);
        
        // Fetch user progress if logged in
        if (currentUser.value) {
          await fetchUserProgress();
        }
        
        console.log('✅ All data fetched for language:', props.language);
      };
      
      // Lifecycle
      onMounted(async () => {
        console.log('🎯 VocabularyTopics mounted for language:', props.language);
        await fetchData();
      });
      
      // Watch for language changes
      watch(() => props.language, async (newLanguage, oldLanguage) => {
        if (newLanguage !== oldLanguage) {
          console.log('🔄 Language changed from', oldLanguage, 'to', newLanguage);
          await fetchData();
        }
      });
      
      // Watch for user login/logout
      watch(currentUser, async (newUser, oldUser) => {
        if (newUser && !oldUser) {
          // User just logged in
          console.log('👤 User logged in, fetching user progress...');
          await fetchUserProgress();
        } else if (!newUser && oldUser) {
          // User logged out
          console.log('👋 User logged out, clearing user progress...');
          userProgress.value = null;
        }
      });
      
      return {
        loading,
        error,
        topics,
        languageStats,
        userProgress,
        searchQuery,
        selectedDifficulty,
        toastMessage,
        toastType,
        difficultyLevels,
        filteredTopics,
        lastTopic,
        reviewCount,
        
        // Methods
        getLanguageFlag,
        getLanguageName,
        getTopicIcon,
        getTopicDescription,
        getDifficultyIcon,
        getDifficultyLabel,
        getTopicProgress,
        isTopicCompleted,
        isTopicInProgress,
        selectTopic,
        goBack,
        clearFilters,
        startRandomQuiz,
        continueLastTopic,
        reviewWords,
        fetchTopics
      };
    }
  };
  </script>
  
  <style scoped>
  .vocabulary-topics {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  /* Header */
  .page-header {
    margin-bottom: 40px;
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
    margin-bottom: 24px;
  }
  
  .language-flag {
    font-size: 4rem;
  }
  
  .language-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1f2937;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .language-subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    margin: 8px 0 0 0;
  }
  
  .language-stats {
    display: flex;
    gap: 24px;
    justify-content: center;
  }
  
  .stat-item {
    text-align: center;
    background: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    min-width: 100px;
  }
  
  .stat-number {
    font-size: 1.75rem;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  /* Controls */
  .controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .search-box {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .search-input {
    width: 100%;
    padding: 14px 20px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
  
  .filter-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .filter-btn {
    background: white;
    border: 2px solid #e5e7eb;
    color: #374151;
    padding: 10px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .filter-btn:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  
  .filter-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }
  
  /* Loading, Error, Empty States */
  .loading-container,
  .error-container,
  .empty-state {
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
  
  .error-icon,
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .retry-btn,
  .clear-filters-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 20px;
    transition: background 0.2s;
  }
  
  .retry-btn:hover,
  .clear-filters-btn:hover {
    background: #2563eb;
  }
  
  /* Topics Grid */
  .topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 50px;
  }
  
  .topic-card {
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
  
  .topic-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    border-color: #3b82f6;
  }
  
  .topic-card.completed {
    border-color: #10b981;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  }
  
  .topic-card.in-progress {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }
  
  .topic-card.completed:hover {
    border-color: #059669;
  }
  
  .topic-card.in-progress:hover {
    border-color: #d97706;
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
    color: #1f2937;
    margin: 0 0 8px 0;
    text-align: center;
  }
  
  .topic-description {
    font-size: 0.875rem;
    color: #6b7280;
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
    background: #f3f4f6;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #374151;
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
  
  .stat-icon {
    font-size: 1rem;
  }
  
  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .progress-bar {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #3b82f6;
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
    background: #10b981;
    color: white;
  }
  
  .status-badge.in-progress {
    background: #f59e0b;
  }
  
  .status-badge.new {
    background: #6b7280;
  }
  
  .card-arrow {
    position: absolute;
    bottom: 16px;
    right: 16px;
    font-size: 1.5rem;
    color: #9ca3af;
    transition: transform 0.3s ease;
  }
  
  .topic-card:hover .card-arrow {
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
    max-width: 800px;
    margin: 0 auto;
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
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .vocabulary-topics {
      padding: 16px;
    }
    
    .language-header {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }
    
    .language-flag {
      font-size: 3rem;
    }
    
    .language-title {
      font-size: 2rem;
    }
    
    .language-stats {
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    
    .stat-item {
      min-width: 80px;
      padding: 12px 16px;
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
    
    .topics-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .action-cards {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .language-stats {
      flex-direction: row;
      justify-content: space-around;
    }
    
    .stat-item {
      min-width: 70px;
      padding: 10px 12px;
    }
    
    .stat-number {
      font-size: 1.5rem;
    }
    
    .filter-buttons {
      justify-content: center;
    }
    
    .topic-stats {
      gap: 6px;
    }
    
    .stat-badge {
      padding: 4px 8px;
      font-size: 0.8rem;
    }
  }
  </style>