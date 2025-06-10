<template>
    <div class="vocabulary-in-page">
      <!-- Header -->
      <div class="page-header">
        <button @click="goBack" class="back-btn">
          ← Назад
        </button>
        
        <div class="language-header">
          <div class="language-flag-large">{{ getLanguageFlag(languageCode) }}</div>
          <div class="language-info-detailed">
            <h1 class="selected-language-title">{{ getSelectedLanguageName() }}</h1>
            <p class="selected-language-subtitle">
              {{ currentView === 'topics' ? 'Выберите тему для изучения' : 
                 currentView === 'learning' ? `Изучение: ${selectedTopic}` :
                 currentView === 'test' ? 'Тестирование' : '' }}
            </p>
          </div>
        </div>
  
        <!-- Test Button (visible in topics view) -->
        <button 
          v-if="currentView === 'topics'"
          @click="openCreateTestModal" 
          class="create-test-btn"
        >
          🎯 Создать тест
        </button>
      </div>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>
  
      <!-- Topics View -->
      <section v-else-if="currentView === 'topics'" class="topics-section">
        <!-- Search and Filter -->
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
            <div class="topic-icon">{{ getTopicIcon(topic.name) }}</div>
            
            <div class="topic-content">
              <h3 class="topic-name">{{ getTopicNameRu(topic.name) }}</h3>
              <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
              
              <div class="topic-stats">
                <div class="stat-badge">
                  <span class="stat-icon">📝</span>
                  <span>{{ topic.wordCount || 8 }} слов</span>
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
          </div>
        </div>
  
        <!-- No Topics Found -->
        <div v-else class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>Темы не найдены</h3>
          <p>Попробуйте изменить поисковый запрос или сбросить фильтры</p>
          <button v-if="searchQuery || selectedDifficulty" @click="clearFilters" class="clear-filters-btn">
            Очистить фильтры
          </button>
        </div>
      </section>
  
      <!-- Learning View -->
      <section v-else-if="currentView === 'learning'" class="learning-section">
        <div class="learning-header">
          <div class="learning-title">
            <h2>{{ getTopicNameRu(selectedTopic) }}</h2>
            <p>{{ currentWords.length }} слов для изучения</p>
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
  
        <!-- Learning Complete -->
        <div v-if="learningComplete" class="learning-complete">
          <div class="complete-icon">🎉</div>
          <h3>Поздравляем!</h3>
          <p>Вы изучили все слова в теме "{{ getTopicNameRu(selectedTopic) }}"</p>
          <div class="complete-stats">
            <div class="stat-item">
              <span class="stat-number">{{ currentWords.length }}</span>
              <span class="stat-label">слов изучено</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ learningProgress.length }}</span>
              <span class="stat-label">отмечено как изученные</span>
            </div>
          </div>
          <div class="complete-actions">
            <button @click="startTopicTest" class="btn-primary test-btn">
              🎯 Пройти тест по теме
            </button>
            <button @click="goBackToTopics" class="btn-secondary">
              Выбрать другую тему
            </button>
          </div>
        </div>
  
        <!-- Word Card -->
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
            <button @click="startTopicTest" class="test-btn-floating" :disabled="learningProgress.length < 3">
              🎯 Тест ({{ learningProgress.length }}/{{ currentWords.length }})
            </button>
          </div>
        </div>
      </section>
  
      <!-- Test View -->
      <section v-else-if="currentView === 'test'" class="test-section">
        <div class="test-header">
          <div class="test-title">
            <h2>Тестирование{{ testConfig.type === 'random' ? ': Случайные слова' : `: ${getTopicNameRu(selectedTopic)}` }}</h2>
            <p v-if="!testComplete">Вопрос {{ currentQuestionIndex + 1 }} из {{ testQuestions.length }}</p>
          </div>
        </div>
  
        <!-- Test Results -->
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
            <button @click="goBackToTopics" class="btn-secondary">
              Вернуться к темам
            </button>
          </div>
        </div>
  
        <!-- Test Question -->
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
  import CreateTestModal from '../components/Modals/CreateTestModal';
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
        { value: 'beginner', label: 'Начальный', icon: '🟢' },
        { value: 'intermediate', label: 'Средний', icon: '🟡' },
        { value: 'advanced', label: 'Продвинутый', icon: '🔴' }
      ];
  
      // Language data
      const languageNames = {
        english: { name: 'English', nameRu: 'Английский' },
        spanish: { name: 'Spanish', nameRu: 'Испанский' },
        french: { name: 'French', nameRu: 'Французский' },
        german: { name: 'German', nameRu: 'Немецкий' },
        chinese: { name: 'Chinese', nameRu: 'Китайский' },
        arabic: { name: 'Arabic', nameRu: 'Арабский' },
        japanese: { name: 'Japanese', nameRu: 'Японский' },
        korean: { name: 'Korean', nameRu: 'Корейский' },
        uzbek: { name: 'Uzbek', nameRu: 'Узбекский' },
        russian: { name: 'Russian', nameRu: 'Русский' }
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
          'Travel': 'Путешествия', 'Business': 'Бизнес', 'Food': 'Еда',
          'Family': 'Семья', 'Education': 'Образование', 'Health': 'Здоровье',
          'Technology': 'Технологии', 'Sports': 'Спорт', 'Music': 'Музыка',
          'Art': 'Искусство', 'Nature': 'Природа', 'Animals': 'Животные'
        };
        return translations[topicName] || topicName;
      };
  
      const getTopicDescription = (topicName) => {
        const descriptions = {
          'Travel': 'Слова для путешествий и туризма',
          'Business': 'Деловая лексика и термины',
          'Food': 'Еда, напитки и приготовление пищи',
          'Family': 'Семья, родственники и отношения',
          'Education': 'Образование, школа, университет',
          'Health': 'Здоровье, медицина, части тела',
          'Technology': 'Технологии, компьютеры, интернет',
          'Sports': 'Спорт, игры, физическая активность'
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
          showToast('Пожалуйста, войдите в систему для создания теста', 'error');
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
          showToast('Не удалось найти слова для теста', 'error');
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
          showToast('🎉 Вы изучили все слова!');
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
          showToast('Изучите минимум 3 слова для прохождения теста', 'error');
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
          showToast(`🎉 Тест пройден! Результат: ${percentage}%`);
        } else {
          showToast(`📚 Продолжайте изучение. Результат: ${percentage}%`, 'info');
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
          showToast('Не удалось загрузить темы', 'error');
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
          showToast('Не удалось загрузить слова', 'error');
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
          showToast('Не удалось загрузить слова', 'error');
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
          showToast('Не удалось загрузить слова', 'error');
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
        getDifficultyIcon,
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
  /* CSS Variables */
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
  }
  
  /* Base styles */
  .vocabulary-in-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    color: var(--text-primary);
  }
  
  /* Page Header */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .back-btn {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: #e5e7eb;
    transform: translateX(-2px);
  }
  
  .language-header {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    justify-content: center;
  }
  
  .language-flag-large {
    font-size: 4rem;
  }
  
  .language-info-detailed {
    text-align: left;
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
  
  .create-test-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
  }
  
  .create-test-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  /* Loading State */
  .loading-container {
    text-align: center;
    padding: 80px 24px;
    color: var(--text-primary);
  }
  
  .loading-container p {
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
  
  /* Topics Section */
  .topics-section {
    margin-bottom: 80px;
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
    color: var(--text-primary);
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
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 80px 24px;
    color: var(--text-primary);
  }
  
  .empty-state p {
    color: var(--text-secondary);
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 24px;
  }
  
  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 16px;
  }
  
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
  
  .clear-filters-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
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
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  .learning-title p {
    color: var(--text-secondary);
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
    color: var(--text-primary);
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
  
  /* Learning Complete */
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
    color: var(--text-primary);
    margin-bottom: 16px;
  }
  
  .learning-complete p {
    color: var(--text-secondary);
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
    color: var(--primary-color);
    display: block;
  }
  
  .complete-stats .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .complete-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  /* Word Card */
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
  
  .word-main-display {
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 32px;
    line-height: 1.2;
  }
  
  .word-details {
    margin-bottom: 32px;
  }
  
  .word-type {
    font-size: 0.875rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  
  .translation-section {
    margin-bottom: 24px;
  }
  
  .show-translation-btn {
    background: var(--primary-light);
    color: var(--primary-dark);
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
    color: white;
  }
  
  .word-translation-display {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--secondary-color);
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .word-example {
    background: var(--border-light);
    padding: 16px;
    border-radius: var(--border-radius-md);
    margin-top: 16px;
    font-style: italic;
    color: var(--text-secondary);
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
    color: white;
  }
  
  .btn-success:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .btn-primary {
    background: var(--gradient-primary);
    color: white;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .btn-secondary {
    background: var(--border-light);
    color: var(--text-primary);
    border: 2px solid var(--border-color);
  }
  
  .btn-secondary:hover {
    background: var(--border-color);
  }
  
  /* Learning Controls */
  .learning-controls {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
  }
  
  .test-btn-floating {
    background: var(--gradient-primary);
    color: white;
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
  
  /* Test Section */
  .test-section {
    margin-bottom: 80px;
    position: relative;
    z-index: 1;
  }
  
  .test-header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .test-title h2 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  .test-title p {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
  
  /* Test Results */
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
    color: var(--text-primary);
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
    color: var(--primary-color);
    display: block;
  }
  
  .result-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .results-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  /* Test Question */
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
    color: var(--text-secondary);
    margin-bottom: 20px;
    font-weight: 500;
  }
  
  .test-word {
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-primary);
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
    color: var(--text-primary);
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
  
  /* Test Button */
  .test-btn {
    background: var(--gradient-primary);
    color: white;
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
  
  /* Responsive Design */
  @media (max-width: 1024px) {
    .vocabulary-in-page {
      padding: 24px 20px;
    }
  
    .topics-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
  }
  
  @media (max-width: 768px) {
    .vocabulary-in-page {
      padding: 20px 16px;
    }
  
    .page-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }
  
    .language-header {
      flex-direction: column;
      gap: 12px;
      margin: 20px 0;
    }
  
    .language-flag-large {
      font-size: 3rem;
    }
  
    .selected-language-title {
      font-size: 2rem;
    }
  
    .create-test-btn {
      width: 100%;
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
  }
  
  @media (max-width: 480px) {
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
  .topic-card:focus,
  .filter-btn:focus,
  .option-btn:focus {
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
  </style>