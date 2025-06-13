<template>
  <div class="vocabulary-in-page">
    <!-- Header -->
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>
      
      <div class="language-info">
        <span class="language-flag">{{ getLanguageFlag(languageCode) }}</span>
        <div class="language-details">
          <h1 class="language-title">{{ getSelectedLanguageName() }}</h1>
          <p class="language-subtitle">
            {{ currentView === 'topics' ? 'Select a topic to start learning' : 
               currentView === 'learning' ? `Learning: ${selectedTopic}` :
               currentView === 'test' ? 'Testing Mode' : '' }}
          </p>
        </div>
      </div>

      <!-- Test Button (visible in topics view) -->
      <button 
        v-if="currentView === 'topics'"
        @click="openCreateTestModal" 
        class="create-test-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Create Test
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>

    <!-- Topics View -->
    <section v-else-if="currentView === 'topics'" class="topics-section">
      <!-- Search and Filter -->
      <div class="controls">
        <div class="search-container">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search topics..."
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
            {{ difficulty.label }}
          </button>
        </div>
      </div>

      <!-- Topics Grid -->
      <div v-if="filteredTopics.length > 0" class="topics-grid">
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
          <div class="card-header">
            <div class="topic-icon">{{ getTopicIcon(topic.name) }}</div>
            <div class="topic-status">
              <div v-if="isTopicCompleted(topic)" class="status-indicator completed">✓</div>
              <div v-else-if="isTopicInProgress(topic)" class="status-indicator in-progress">⋯</div>
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="topic-name">{{ getTopicNameRu(topic.name) }}</h3>
            <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
            
            <div class="topic-meta">
              <span class="meta-item">{{ topic.wordCount || 8 }} words</span>
              <span class="meta-item difficulty" :class="topic.difficulty || 'beginner'">
                {{ getDifficultyLabel(topic.difficulty || 'beginner') }}
              </span>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-container" v-if="getTopicProgress(topic) > 0">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getTopicProgress(topic) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(getTopicProgress(topic)) }}%</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No topics found</h3>
        <p>Try adjusting your search or filters</p>
        <button v-if="searchQuery || selectedDifficulty" @click="clearFilters" class="clear-btn">
          Clear filters
        </button>
      </div>
    </section>

    <!-- Learning View -->
    <section v-else-if="currentView === 'learning'" class="learning-section">
      <div class="learning-header">
        <div class="learning-info">
          <h2>{{ getTopicNameRu(selectedTopic) }}</h2>
          <p>{{ currentWords.length }} words to learn</p>
        </div>

        <div class="learning-progress">
          <span class="progress-counter">{{ currentWordIndex + 1 }} / {{ currentWords.length }}</span>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: ((currentWordIndex + 1) / currentWords.length) * 100 + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Learning Complete -->
      <div v-if="learningComplete" class="learning-complete">
        <div class="complete-content">
          <div class="complete-icon">🎉</div>
          <h3>Congratulations!</h3>
          <p>You've completed all words in "{{ getTopicNameRu(selectedTopic) }}"</p>
          
          <div class="complete-stats">
            <div class="stat-item">
              <span class="stat-number">{{ currentWords.length }}</span>
              <span class="stat-label">words studied</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ learningProgress.length }}</span>
              <span class="stat-label">marked as learned</span>
            </div>
          </div>
          
          <div class="complete-actions">
            <button @click="startTopicTest" class="btn primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Take Topic Test
            </button>
            <button @click="goBackToTopics" class="btn secondary">
              Choose Another Topic
            </button>
          </div>
        </div>
      </div>

      <!-- Word Card -->
      <div v-else class="word-container">
        <div class="word-card" :key="currentWordIndex">
          <div class="word-main">{{ currentWords[currentWordIndex]?.word }}</div>
          
          <div class="word-details">
            <div v-if="currentWords[currentWordIndex]?.partOfSpeech" class="word-type">
              {{ currentWords[currentWordIndex].partOfSpeech }}
            </div>
            
            <div class="translation-section">
              <button @click="toggleTranslation" class="toggle-btn">
                {{ showTranslation ? 'Hide Translation' : 'Show Translation' }}
              </button>
              
              <div v-if="showTranslation" class="word-translation">
                {{ currentWords[currentWordIndex]?.translation }}
              </div>
            </div>

            <div v-if="showTranslation && currentWords[currentWordIndex]?.example" class="word-example">
              <strong>Example:</strong> {{ currentWords[currentWordIndex].example }}
            </div>
          </div>

          <div class="word-actions">
            <button 
              @click="previousWord" 
              :disabled="currentWordIndex === 0"
              class="btn secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Previous
            </button>
            
            <button @click="markWordAsLearned" class="btn success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Learned
            </button>
            
            <button 
              @click="nextWord" 
              class="btn primary"
            >
              {{ currentWordIndex === currentWords.length - 1 ? 'Complete' : 'Next' }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Floating Test Button -->
        <button 
          @click="startTopicTest" 
          class="floating-test-btn" 
          :disabled="learningProgress.length < 3"
          :title="`Need 3+ learned words (${learningProgress.length}/${currentWords.length})`"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Test ({{ learningProgress.length }}/{{ currentWords.length }})
        </button>
      </div>
    </section>

    <!-- Test View -->
    <section v-else-if="currentView === 'test'" class="test-section">
      <div class="test-header">
        <h2>{{ testConfig.type === 'random' ? 'Random Words Test' : `${getTopicNameRu(selectedTopic)} Test` }}</h2>
        <p v-if="!testComplete">Question {{ currentQuestionIndex + 1 }} of {{ testQuestions.length }}</p>
      </div>

      <!-- Test Results -->
      <div v-if="testComplete" class="test-results">
        <div class="results-content">
          <div class="results-icon" :class="{ passed: testResults.passed, failed: !testResults.passed }">
            {{ testResults.passed ? '🎉' : '📚' }}
          </div>
          
          <h3>{{ testResults.passed ? 'Test Passed!' : 'Keep Practicing' }}</h3>
          
          <div class="results-stats">
            <div class="result-item">
              <span class="result-number">{{ testResults.percentage }}%</span>
              <span class="result-label">Score</span>
            </div>
            <div class="result-item">
              <span class="result-number">{{ testResults.correct }}/{{ testResults.total }}</span>
              <span class="result-label">Correct</span>
            </div>
          </div>

          <div class="results-actions">
            <button @click="retakeTest" class="btn primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Retake Test
            </button>
            <button @click="goBackToTopics" class="btn secondary">
              Back to Topics
            </button>
          </div>
        </div>
      </div>

      <!-- Test Question -->
      <div v-else class="test-question">
        <div class="question-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: ((currentQuestionIndex + 1) / testQuestions.length) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <div class="question-content">
          <h3>What does this word mean?</h3>
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

    <!-- Create Test Modal -->
    <CreateTestModal 
      v-if="showCreateTestModal"
      :language="languageCode"
      :languageName="getSelectedLanguageName()"
      :topics="topics"
      @close="closeCreateTestModal"
      @create="createCustomTest"
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
import { useRouter, useRoute } from 'vue-router';
import CreateTestModal from '../Modals/CreateTestModal.vue';
import {
  getVocabularyTopics,
  searchVocabulary,
  getUserVocabularyProgress
} from '@/api/vocabulary';

export default {
  name: 'VocabularyIn',
  components: {
    CreateTestModal
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // Data
    const loading = ref(true);
    const languageCode = ref(route.params.languageCode);
    const currentView = ref('topics'); // 'topics', 'learning', 'test'
    const topics = ref([]);
    const currentWords = ref([]);
    const searchQuery = ref('');
    const selectedDifficulty = ref('');
    const selectedTopic = ref('');
    const showCreateTestModal = ref(false);
    const toastMessage = ref('');
    const toastType = ref('success');
    
    // Learning state
    const currentWordIndex = ref(0);
    const learningProgress = ref([]);
    const showTranslation = ref(false);
    const learningComplete = ref(false);
    
    // Test state
    const testConfig = ref({});
    const testQuestions = ref([]);
    const currentQuestionIndex = ref(0);
    const userAnswers = ref([]);
    const testComplete = ref(false);
    const testResults = ref({});
    
    // User progress
    const userProgress = ref(null);

    // Constants
    const difficultyLevels = [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' }
    ];

    // Language data
    const languageNames = {
      english: { name: 'English', nameRu: 'English' },
      spanish: { name: 'Spanish', nameRu: 'Spanish' },
      french: { name: 'French', nameRu: 'French' },
      german: { name: 'German', nameRu: 'German' },
      chinese: { name: 'Chinese', nameRu: 'Chinese' },
      arabic: { name: 'Arabic', nameRu: 'Arabic' },
      japanese: { name: 'Japanese', nameRu: 'Japanese' },
      korean: { name: 'Korean', nameRu: 'Korean' },
      uzbek: { name: 'Uzbek', nameRu: 'Uzbek' },
      russian: { name: 'Russian', nameRu: 'Russian' }
    };

    // Computed
    const currentUser = computed(() => store.getters.user);
    
    const filteredTopics = computed(() => {
      let filtered = [...topics.value];
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(topic =>
          topic.name.toLowerCase().includes(query) ||
          getTopicNameRu(topic.name).toLowerCase().includes(query)
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
        english: '🇺🇸', spanish: '🇪🇸', french: '🇫🇷', german: '🇩🇪',
        chinese: '🇨🇳', arabic: '🇸🇦', japanese: '🇯🇵', korean: '🇰🇷',
        uzbek: '🇺🇿', russian: '🇷🇺'
      };
      return flags[code] || '🌐';
    };

    const getSelectedLanguageName = () => {
      const lang = languageNames[languageCode.value];
      return lang ? lang.nameRu : languageCode.value;
    };

    const getTopicIcon = (topicName) => {
      const icons = {
        'Travel': '✈️', 'Business': '💼', 'Food': '🍽️', 'Family': '👨‍👩‍👧‍👦',
        'Education': '🎓', 'Health': '🏥', 'Technology': '💻', 'Sports': '⚽',
        'Music': '🎵', 'Art': '🎨', 'Nature': '🌿', 'Animals': '🐾'
      };
      return icons[topicName] || '📖';
    };

    const getTopicNameRu = (topicName) => {
      const translations = {
        'Travel': 'Travel', 'Business': 'Business', 'Food': 'Food',
        'Family': 'Family', 'Education': 'Education', 'Health': 'Health',
        'Technology': 'Technology', 'Sports': 'Sports', 'Music': 'Music',
        'Art': 'Art', 'Nature': 'Nature', 'Animals': 'Animals'
      };
      return translations[topicName] || topicName;
    };

    const getTopicDescription = (topicName) => {
      const descriptions = {
        'Travel': 'Essential words for travel and tourism',
        'Business': 'Professional vocabulary and terms',
        'Food': 'Food, drinks and cooking vocabulary',
        'Family': 'Family members and relationships',
        'Education': 'School, university and learning',
        'Health': 'Health, medicine and body parts',
        'Technology': 'Technology, computers and internet',
        'Sports': 'Sports, games and physical activities'
      };
      return descriptions[topicName] || 'Learn new words and expressions';
    };

    const getDifficultyLabel = (difficulty) => {
      const labels = { 
        beginner: 'Beginner', 
        intermediate: 'Intermediate', 
        advanced: 'Advanced' 
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

    const goBack = () => {
      if (currentView.value === 'learning' || currentView.value === 'test') {
        currentView.value = 'topics';
        resetLearningState();
      } else {
        router.push({ name: 'VocabularyPage' });
      }
    };

    const goBackToTopics = () => {
      currentView.value = 'topics';
      resetLearningState();
    };

    const selectTopic = async (topic) => {
      selectedTopic.value = topic.name;
      currentView.value = 'learning';
      await fetchTopicWords(topic.name);
    };

    const toggleDifficulty = (difficulty) => {
      selectedDifficulty.value = selectedDifficulty.value === difficulty ? '' : difficulty;
    };

    const clearFilters = () => {
      searchQuery.value = '';
      selectedDifficulty.value = '';
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

    const createCustomTest = async (config) => {
      testConfig.value = config;
      closeCreateTestModal();
      
      if (config.type === 'random') {
        await fetchRandomWords(config.wordCount);
      } else {
        await fetchTopicsWords(config.topics);
      }
      
      if (currentWords.value.length > 0) {
        startTest();
      } else {
        showToast('Could not find words for test', 'error');
      }
    };

    // Learning methods
    const resetLearningState = () => {
      currentWordIndex.value = 0;
      learningProgress.value = [];
      showTranslation.value = false;
      learningComplete.value = false;
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
        showToast('🎉 You completed all words!');
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
        showToast('✅ Word marked as learned');
      }
    };

    // Test methods
    const startTest = () => {
      testQuestions.value = generateTestQuestions(currentWords.value);
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
      currentView.value = 'test';
    };

    const startTopicTest = () => {
      const learnedWords = currentWords.value.filter(word => 
        learningProgress.value.includes(word._id)
      );

      if (learnedWords.length < 3) {
        showToast('Learn at least 3 words to take the test', 'error');
        return;
      }

      testConfig.value = { type: 'topic', topics: [selectedTopic.value] };
      currentWords.value = learnedWords;
      startTest();
    };

    const generateTestQuestions = (words) => {
      const questions = [];
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const numQuestions = Math.min(10, shuffledWords.length);

      shuffledWords.slice(0, numQuestions).forEach(word => {
        const options = [word.translation];
        const otherWords = words.filter(w => w._id !== word._id);
        const wrongAnswers = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.translation);
        
        options.push(...wrongAnswers);
        
        questions.push({
          word: word.word,
          correctAnswer: word.translation,
          options: options.sort(() => Math.random() - 0.5)
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
        showToast(`🎉 Test passed! Score: ${percentage}%`);
      } else {
        showToast(`📚 Keep practicing. Score: ${percentage}%`, 'info');
      }
    };

    const retakeTest = () => {
      testQuestions.value = generateTestQuestions(currentWords.value);
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
    };

    // API calls
    const fetchTopics = async () => {
      try {
        loading.value = true;
        
        // Sample topics for demo
        topics.value = [
          { name: 'Travel', difficulty: 'beginner', wordCount: 8 },
          { name: 'Food', difficulty: 'beginner', wordCount: 8 },
          { name: 'Family', difficulty: 'intermediate', wordCount: 8 },
          { name: 'Business', difficulty: 'intermediate', wordCount: 8 },
          { name: 'Technology', difficulty: 'advanced', wordCount: 8 },
          { name: 'Health', difficulty: 'beginner', wordCount: 8 }
        ];
        
      } catch (err) {
        console.error('Error fetching topics:', err);
        showToast('Failed to load topics', 'error');
      } finally {
        loading.value = false;
      }
    };

    const fetchTopicWords = async (topicName) => {
      try {
        loading.value = true;
        
        // Generate sample words
        const sampleWords = generateSampleWords(languageCode.value, topicName);
        currentWords.value = sampleWords;
        resetLearningState();
        
      } catch (err) {
        console.error('Error fetching words:', err);
        showToast('Failed to load words', 'error');
      } finally {
        loading.value = false;
      }
    };

    const fetchRandomWords = async (count) => {
      try {
        loading.value = true;
        
        // Get random words from all topics
        const allWords = [];
        ['Travel', 'Food', 'Family'].forEach(topic => {
          allWords.push(...generateSampleWords(languageCode.value, topic));
        });
        
        currentWords.value = allWords
          .sort(() => Math.random() - 0.5)
          .slice(0, count);
          
      } catch (err) {
        console.error('Error fetching random words:', err);
        showToast('Failed to load words', 'error');
      } finally {
        loading.value = false;
      }
    };

    const fetchTopicsWords = async (topicNames) => {
      try {
        loading.value = true;
        
        const words = [];
        topicNames.forEach(topic => {
          words.push(...generateSampleWords(languageCode.value, topic));
        });
        
        currentWords.value = words;
        
      } catch (err) {
        console.error('Error fetching topic words:', err);
        showToast('Failed to load words', 'error');
      } finally {
        loading.value = false;
      }
    };

    const fetchUserProgress = async () => {
      if (!currentUser.value) return;
      
      try {
        const response = await getUserVocabularyProgress(currentUser.value.uid);
        userProgress.value = response.data || {};
      } catch (err) {
        console.error('Error fetching user progress:', err);
      }
    };

    const generateSampleWords = (lang, topic) => {
      const vocabularyData = {
        english: {
          'Travel': [
            { _id: 'en_travel_1', word: 'airport', translation: 'аэропорт', example: 'I arrived at the airport early.', partOfSpeech: 'noun' },
            { _id: 'en_travel_2', word: 'hotel', translation: 'отель', example: 'The hotel was comfortable.', partOfSpeech: 'noun' },
            { _id: 'en_travel_3', word: 'passport', translation: 'паспорт', example: 'Don\'t forget your passport.', partOfSpeech: 'noun' },
            { _id: 'en_travel_4', word: 'luggage', translation: 'багаж', example: 'My luggage is heavy.', partOfSpeech: 'noun' },
            { _id: 'en_travel_5', word: 'flight', translation: 'рейс', example: 'The flight was delayed.', partOfSpeech: 'noun' },
            { _id: 'en_travel_6', word: 'ticket', translation: 'билет', example: 'I bought a ticket online.', partOfSpeech: 'noun' },
            { _id: 'en_travel_7', word: 'vacation', translation: 'отпуск', example: 'I love my vacation.', partOfSpeech: 'noun' },
            { _id: 'en_travel_8', word: 'tourist', translation: 'турист', example: 'The tourist took photos.', partOfSpeech: 'noun' }
          ],
          'Food': [
            { _id: 'en_food_1', word: 'apple', translation: 'яблоко', example: 'I eat an apple every day.', partOfSpeech: 'noun' },
            { _id: 'en_food_2', word: 'bread', translation: 'хлеб', example: 'Fresh bread smells good.', partOfSpeech: 'noun' },
            { _id: 'en_food_3', word: 'cheese', translation: 'сыр', example: 'This cheese is delicious.', partOfSpeech: 'noun' },
            { _id: 'en_food_4', word: 'chicken', translation: 'курица', example: 'Grilled chicken is healthy.', partOfSpeech: 'noun' },
            { _id: 'en_food_5', word: 'vegetables', translation: 'овощи', example: 'Eat more vegetables.', partOfSpeech: 'noun' },
            { _id: 'en_food_6', word: 'fruit', translation: 'фрукт', example: 'Fruit is good for you.', partOfSpeech: 'noun' },
            { _id: 'en_food_7', word: 'water', translation: 'вода', example: 'Drink plenty of water.', partOfSpeech: 'noun' },
            { _id: 'en_food_8', word: 'coffee', translation: 'кофе', example: 'I drink coffee in the morning.', partOfSpeech: 'noun' }
          ],
          'Family': [
            { _id: 'en_family_1', word: 'mother', translation: 'мать', example: 'My mother is kind.', partOfSpeech: 'noun' },
            { _id: 'en_family_2', word: 'father', translation: 'отец', example: 'My father works hard.', partOfSpeech: 'noun' },
            { _id: 'en_family_3', word: 'brother', translation: 'брат', example: 'I have one brother.', partOfSpeech: 'noun' },
            { _id: 'en_family_4', word: 'sister', translation: 'сестра', example: 'My sister is younger.', partOfSpeech: 'noun' },
            { _id: 'en_family_5', word: 'child', translation: 'ребенок', example: 'The child is playing.', partOfSpeech: 'noun' },
            { _id: 'en_family_6', word: 'parents', translation: 'родители', example: 'My parents are proud.', partOfSpeech: 'noun' },
            { _id: 'en_family_7', word: 'family', translation: 'семья', example: 'Family is important.', partOfSpeech: 'noun' },
            { _id: 'en_family_8', word: 'grandmother', translation: 'бабушка', example: 'My grandmother tells stories.', partOfSpeech: 'noun' }
          ]
        },
        // Add more languages as needed
      };

      return vocabularyData[lang]?.[topic] || [];
    };

    // Check for test mode from query params
    const checkTestMode = () => {
      if (route.query.mode === 'test') {
        const config = {
          type: route.query.type || 'random',
          wordCount: parseInt(route.query.count) || 10,
          topics: route.query.topics ? route.query.topics.split(',') : []
        };
        
        createCustomTest(config);
      }
    };

    // Lifecycle
    onMounted(async () => {
      await fetchTopics();
      await fetchUserProgress();
      checkTestMode();
    });

    return {
      loading,
      languageCode,
      currentView,
      topics,
      currentWords,
      searchQuery,
      selectedDifficulty,
      selectedTopic,
      showCreateTestModal,
      toastMessage,
      toastType,
      currentWordIndex,
      learningProgress,
      showTranslation,
      learningComplete,
      testConfig,
      testQuestions,
      currentQuestionIndex,
      userAnswers,
      testComplete,
      testResults,
      difficultyLevels,
      filteredTopics,
      currentUser,
      getLanguageFlag,
      getSelectedLanguageName,
      getTopicIcon,
      getTopicNameRu,
      getTopicDescription,
      getDifficultyLabel,
      getTopicProgress,
      isTopicCompleted,
      isTopicInProgress,
      goBack,
      goBackToTopics,
      selectTopic,
      toggleDifficulty,
      clearFilters,
      openCreateTestModal,
      closeCreateTestModal,
      createCustomTest,
      nextWord,
      previousWord,
      toggleTranslation,
      markWordAsLearned,
      startTopicTest,
      submitTestAnswer,
      retakeTest
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
  --success: #10b981;
  --error: #ef4444;
}

/* Base */
.vocabulary-in-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: var(--white);
  color: var(--black);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--gray-200);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.language-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.language-flag {
  font-size: 32px;
}

.language-details {
  text-align: center;
}

.language-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--black);
}

.language-subtitle {
  font-size: 14px;
  color: var(--gray-600);
  margin: 0;
}

.create-test-btn {
  display: flex;
  align-items: center;
  gap: 8px;
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

.create-test-btn:hover {
  background: var(--brand-purple-dark);
}

/* Loading State */
.loading-state {
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

/* Topics Section */
.topics-section {
  margin-bottom: 48px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.search-container {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: 14px;
  background: var(--white);
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-purple);
}

.filter-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--white);
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: var(--gray-400);
  background: var(--gray-50);
}

.filter-btn.active {
  background: var(--brand-purple);
  border-color: var(--brand-purple);
  color: var(--white);
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.topic-card {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--white);
}

.topic-card:hover {
  border-color: var(--brand-purple);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.topic-card.completed {
  border-color: var(--success);
}

.topic-card.in-progress {
  border-color: #f59e0b;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.topic-icon {
  font-size: 24px;
}

.status-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.status-indicator.completed {
  background: var(--success);
  color: var(--white);
}

.status-indicator.in-progress {
  background: #f59e0b;
  color: var(--white);
}

.card-content {
  margin-bottom: 16px;
}

.topic-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 8px 0;
}

.topic-description {
  font-size: 14px;
  color: var(--gray-600);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.topic-meta {
  display: flex;
  gap: 12px;
}

.meta-item {
  font-size: 12px;
  color: var(--gray-600);
  background: var(--gray-100);
  padding: 4px 8px;
  border-radius: 4px;
}

.meta-item.difficulty.beginner {
  background: #dcfce7;
  color: #166534;
}

.meta-item.difficulty.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.meta-item.difficulty.advanced {
  background: #fee2e2;
  color: #991b1b;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--brand-purple);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-purple);
  min-width: 30px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--gray-600);
  margin-bottom: 24px;
}

.clear-btn {
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

.clear-btn:hover {
  background: var(--brand-purple-dark);
}

/* Learning Section */
.learning-section {
  margin-bottom: 48px;
}

.learning-header {
  text-align: center;
  margin-bottom: 32px;
}

.learning-info h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 4px 0;
}

.learning-info p {
  color: var(--gray-600);
  margin: 0 0 24px 0;
}

.learning-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 300px;
  margin: 0 auto;
}

.progress-counter {
  font-weight: 600;
  color: var(--black);
  font-size: 14px;
  min-width: 60px;
}

/* Learning Complete */
.learning-complete {
  max-width: 500px;
  margin: 0 auto;
}

.complete-content {
  text-align: center;
  padding: 48px 24px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: var(--white);
}

.complete-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.complete-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 8px 0;
}

.complete-content p {
  color: var(--gray-600);
  margin-bottom: 32px;
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-purple);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--gray-600);
  margin-top: 4px;
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Word Container */
.word-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.word-card {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: var(--white);
  margin-bottom: 24px;
}

.word-main {
  font-size: 36px;
  font-weight: 700;
  color: var(--black);
  margin-bottom: 24px;
  line-height: 1.2;
}

.word-details {
  margin-bottom: 32px;
}

.word-type {
  font-size: 12px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.translation-section {
  margin-bottom: 16px;
}

.toggle-btn {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--gray-200);
}

.word-translation {
  font-size: 20px;
  font-weight: 600;
  color: var(--brand-purple);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.word-example {
  background: var(--gray-50);
  padding: 16px;
  border-radius: 6px;
  font-style: italic;
  color: var(--gray-700);
  text-align: left;
}

.word-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn.primary {
  background: var(--brand-purple);
  color: var(--white);
}

.btn.primary:hover {
  background: var(--brand-purple-dark);
}

.btn.secondary {
  background: var(--white);
  color: var(--gray-700);
  border-color: var(--gray-300);
}

.btn.secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.btn.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.success {
  background: var(--success);
  color: var(--white);
}

.btn.success:hover {
  background: #059669;
}

/* Floating Test Button */
.floating-test-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--brand-purple);
  color: var(--white);
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.floating-test-btn:hover:not(:disabled) {
  background: var(--brand-purple-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.floating-test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Test Section */
.test-section {
  margin-bottom: 48px;
}

.test-header {
  text-align: center;
  margin-bottom: 32px;
}

.test-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 4px 0;
}

.test-header p {
  color: var(--gray-600);
}

/* Test Results */
.test-results {
  max-width: 500px;
  margin: 0 auto;
}

.results-content {
  text-align: center;
  padding: 48px 24px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: var(--white);
}

.results-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.results-icon.passed {
  color: var(--success);
}

.results-icon.failed {
  color: #f59e0b;
}

.results-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--black);
  margin: 0 0 24px 0;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.result-item {
  text-align: center;
}

.result-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-purple);
  line-height: 1;
}

.result-label {
  font-size: 12px;
  color: var(--gray-600);
  margin-top: 4px;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Test Question */
.test-question {
  max-width: 600px;
  margin: 0 auto;
}

.question-progress {
  margin-bottom: 32px;
}

.question-content {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: var(--white);
}

.question-content h3 {
  font-size: 16px;
  color: var(--gray-600);
  margin: 0 0 16px 0;
  font-weight: 500;
}

.test-word {
  font-size: 32px;
  font-weight: 700;
  color: var(--black);
  line-height: 1.2;
}

.question-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.option-btn {
  background: var(--white);
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
  padding: 16px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-btn:hover {
  border-color: var(--brand-purple);
  background: var(--gray-50);
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
  background: var(--error);
}

.toast.info {
  background: #3b82f6;
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
  .vocabulary-in-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .language-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .topics-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    align-items: center;
  }
  
  .filter-buttons {
    gap: 6px;
  }
  
  .word-card {
    padding: 24px 16px;
  }
  
  .word-main {
    font-size: 28px;
  }
  
  .word-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
  
  .complete-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .results-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .question-options {
    grid-template-columns: 1fr;
  }
  
  .floating-test-btn {
    bottom: 16px;
    right: 16px;
    padding: 10px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .learning-progress {
    flex-direction: column;
    gap: 8px;
  }
  
  .complete-actions,
  .results-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 250px;
  }
}
</style>